import type { SupabaseClient } from "@supabase/supabase-js";
import { matchCategory, type CategorizationRule } from "../ledger/categorize";
import {
  buildExpenseDedupeKey,
  buildIncomeDedupeKey,
} from "../ledger/dedupe";
import { parseSantanderCsv } from "./parse-santander";
import { parseWiseCsv } from "./parse-wise";
import { assignTithes } from "./tithe-match";
import type {
  BatchCounts,
  ImportSourceFormat,
  ProposedRow,
} from "./types";
import type { Database } from "../../types/database";

type Category = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name"
>;

const TITHE_CATEGORY_NAME = "Tithe / Diezmo";
const FALLBACK_CATEGORY_NAME = "Other";

interface ProposeOptions {
  supabase: SupabaseClient<Database>;
  userId: string;
  format: ImportSourceFormat;
  csvText: string;
}

export interface Proposal {
  rows: ProposedRow[];
  counts: BatchCounts;
  skipped: { noComputable: number; unknownKind: number };
  titheCount: number;
}

async function fetchAllInRange<T>(
  query: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  const all: T[] = [];
  const pageSize = 1000;
  let from = 0;
  // Paginated fetch, same pattern as /api/admin/deduplicate
  while (true) {
    const { data, error } = await query(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/**
 * Parse a bank CSV, propose categories via categorization_rules, apply the
 * Wise tithe heuristic, and mark each row new/duplicate/uncategorized against
 * the rows already in the ledger (5-field key + external_ref).
 *
 * Pure read: persisting the batch and inserting rows happen in the routes.
 */
export async function proposeImport({
  supabase,
  userId,
  format,
  csvText,
}: ProposeOptions): Promise<Proposal> {
  const parsed =
    format === "santander_csv"
      ? parseSantanderCsv(csvText)
      : parseWiseCsv(csvText);

  const [categoriesResult, rulesResult] = await Promise.all([
    supabase.from("categories").select("id, name"),
    supabase
      .from("categorization_rules")
      .select("match_type, pattern, category_id, priority")
      .eq("user_id", userId),
  ]);

  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  // categorization_rules may not exist yet (migration pending) — degrade to
  // uncategorized proposals rather than failing the upload.
  const rules: CategorizationRule[] = rulesResult.error
    ? []
    : (rulesResult.data ?? []);

  const categories: Category[] = categoriesResult.data ?? [];
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const categoryByLowerName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c])
  );
  const fallbackCategory =
    categoryByLowerName.get(FALLBACK_CATEGORY_NAME.toLowerCase()) ?? null;
  const titheCategory =
    categoryByLowerName.get(TITHE_CATEGORY_NAME.toLowerCase()) ?? null;

  // 1. Categorize
  const rows: ProposedRow[] = parsed.movements.map((movement) => {
    if (movement.rowType === "income") {
      return {
        ...movement,
        categoryId: null,
        categoryName: null,
        categorySource: "none" as const,
        status: "new" as const,
        include: true,
        needsReview: false,
      };
    }

    const match = matchCategory(movement.rawConcept, movement.bankCategory, rules);
    const categoryId = match?.categoryId ?? fallbackCategory?.id ?? null;

    return {
      ...movement,
      categoryId,
      categoryName: categoryId ? (categoryNameById.get(categoryId) ?? null) : null,
      categorySource: match
        ? match.matchType === "merchant_keyword"
          ? ("rule" as const)
          : ("bank" as const)
        : fallbackCategory
          ? ("fallback" as const)
          : ("none" as const),
      status: "new" as const,
      include: true,
      needsReview: !match,
    };
  });

  // 2. Tithe heuristic (only meaningful when the tithe category exists)
  const titheCount = titheCategory
    ? assignTithes(rows, titheCategory.id, titheCategory.name)
    : 0;

  // 3. Dedupe against existing ledger rows in the batch's date span
  const dates = rows.map((row) => row.date).sort();
  if (dates.length > 0) {
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    const [existingExpenses, existingIncomes] = await Promise.all([
      fetchAllInRange((from, to) =>
        supabase
          .from("expenses")
          .select("amount, date, description, category_id, currency, external_ref")
          .eq("user_id", userId)
          .gte("date", minDate)
          .lte("date", maxDate)
          .range(from, to)
      ),
      fetchAllInRange((from, to) =>
        supabase
          .from("income_entries")
          .select("amount, date, description, source, currency, external_ref")
          .eq("user_id", userId)
          .gte("date", minDate)
          .lte("date", maxDate)
          .range(from, to)
      ),
    ]);

    const existingExpenseKeys = new Set(
      existingExpenses.map((row) => buildExpenseDedupeKey(row))
    );
    const existingIncomeKeys = new Set(
      existingIncomes.map((row) => buildIncomeDedupeKey(row))
    );
    const existingRefs = new Set(
      [...existingExpenses, ...existingIncomes]
        .map((row) => row.external_ref)
        .filter(Boolean)
    );

    for (const row of rows) {
      const isDuplicate =
        existingRefs.has(row.externalRef) ||
        (row.rowType === "expense"
          ? row.categoryId !== null &&
            existingExpenseKeys.has(
              buildExpenseDedupeKey({
                amount: row.amount,
                date: row.date,
                description: row.description,
                category_id: row.categoryId,
                currency: row.currency,
              })
            )
          : existingIncomeKeys.has(
              buildIncomeDedupeKey({
                amount: row.amount,
                date: row.date,
                description: row.description,
                source: row.source ?? "",
                currency: row.currency,
              })
            ));

      if (isDuplicate) {
        row.status = "duplicate";
        row.include = false;
      } else if (row.rowType === "expense" && !row.categoryId) {
        row.status = "uncategorized";
      } else if (row.rowType === "expense" && row.needsReview) {
        row.status = "uncategorized";
      }
    }
  }

  const counts: BatchCounts = {
    new_count: rows.filter((row) => row.status === "new").length,
    duplicate_count: rows.filter((row) => row.status === "duplicate").length,
    uncategorized_count: rows.filter((row) => row.status === "uncategorized")
      .length,
  };

  return { rows, counts, skipped: parsed.skipped, titheCount };
}
