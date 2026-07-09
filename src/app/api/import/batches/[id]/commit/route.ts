import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildExpenseDedupeKey,
  buildIncomeDedupeKey,
} from "@/lib/ledger/dedupe";
import { normalizeForMatch } from "@/lib/ledger/normalize";
import type { ProposedRow } from "@/lib/import/types";
import { resolveLedgerContext } from "@/lib/supabase/ledger";
import type { Database } from "@/types/database";

const paramsSchema = z.object({ id: z.string().uuid() });

const INSERT_CHUNK = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid batch id" }, { status: 400 });
  }

  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, userId } = ledger;

  const { data: batch, error: fetchError } = await supabase
    .from("import_batches")
    .select("id, status, rows")
    .eq("id", parsedParams.data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch batch", details: fetchError.message },
      { status: 500 }
    );
  }
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (batch.status !== "pending") {
    // Double-commit guard
    return NextResponse.json(
      { error: `Batch is already ${batch.status}` },
      { status: 409 }
    );
  }

  const rows = batch.rows as unknown as ProposedRow[];
  const candidates = rows.filter((row) => row.include);

  // Re-run the dedupe check at commit time: rows may have been added between
  // propose and commit. Explicit user overrides (include=true on a row already
  // marked duplicate at propose time) are honored; rows still marked "new" get
  // re-verified.
  const dates = candidates.map((row) => row.date).sort();
  if (dates.length > 0) {
    const [expensesResult, incomesResult] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, date, description, category_id, currency, external_ref")
        .eq("user_id", userId)
        .gte("date", dates[0])
        .lte("date", dates[dates.length - 1])
        .limit(10000),
      supabase
        .from("income_entries")
        .select("amount, date, description, source, currency, external_ref")
        .eq("user_id", userId)
        .gte("date", dates[0])
        .lte("date", dates[dates.length - 1])
        .limit(10000),
    ]);

    if (expensesResult.error || incomesResult.error) {
      return NextResponse.json(
        { error: "Failed to re-check duplicates before commit" },
        { status: 500 }
      );
    }

    const existingExpenseKeys = new Set(
      (expensesResult.data ?? []).map((row) => buildExpenseDedupeKey(row))
    );
    const existingIncomeKeys = new Set(
      (incomesResult.data ?? []).map((row) => buildIncomeDedupeKey(row))
    );
    const existingRefs = new Set(
      [...(expensesResult.data ?? []), ...(incomesResult.data ?? [])]
        .map((row) => row.external_ref)
        .filter(Boolean)
    );

    for (const row of candidates) {
      if (row.status !== "new") continue; // user-overridden duplicates pass
      if (existingRefs.has(row.externalRef)) {
        row.status = "duplicate";
        row.include = false;
        continue;
      }
      const key =
        row.rowType === "expense"
          ? row.categoryId
            ? buildExpenseDedupeKey({
                amount: row.amount,
                date: row.date,
                description: row.description,
                category_id: row.categoryId,
                currency: row.currency,
              })
            : null
          : buildIncomeDedupeKey({
              amount: row.amount,
              date: row.date,
              description: row.description,
              source: row.source ?? "",
              currency: row.currency,
            });
      if (key && (row.rowType === "expense" ? existingExpenseKeys : existingIncomeKeys).has(key)) {
        row.status = "duplicate";
        row.include = false;
      }
    }
  }

  const toInsert = rows.filter((row) => row.include);
  const expenseRows = toInsert.filter(
    (row) => row.rowType === "expense" && row.categoryId
  );
  const incomeRows = toInsert.filter((row) => row.rowType === "income");
  const skippedUncategorized = toInsert.filter(
    (row) => row.rowType === "expense" && !row.categoryId
  ).length;

  let insertedExpenses = 0;
  let insertedIncomes = 0;

  for (const group of chunk(expenseRows, INSERT_CHUNK)) {
    const { error } = await supabase.from("expenses").insert(
      group.map((row) => ({
        user_id: userId,
        category_id: row.categoryId!,
        amount: row.amount,
        currency: row.currency,
        description: row.description || null,
        date: row.date,
        source_kind: "import_csv" as const,
        external_ref: row.externalRef,
        import_batch_id: batch.id,
        needs_review: row.needsReview,
      }))
    );
    if (error) {
      return NextResponse.json(
        {
          error: "Insert failed mid-commit; use rollback to clean up",
          insertedExpenses,
          insertedIncomes,
          details: error.message,
        },
        { status: 500 }
      );
    }
    insertedExpenses += group.length;
  }

  for (const group of chunk(incomeRows, INSERT_CHUNK)) {
    const { error } = await supabase.from("income_entries").insert(
      group.map((row) => ({
        user_id: userId,
        source: row.source || "Import",
        amount: row.amount,
        currency: row.currency,
        description: row.description || null,
        date: row.date,
        source_kind: "import_csv" as const,
        external_ref: row.externalRef,
        import_batch_id: batch.id,
        needs_review: row.needsReview,
      }))
    );
    if (error) {
      return NextResponse.json(
        {
          error: "Insert failed mid-commit; use rollback to clean up",
          insertedExpenses,
          insertedIncomes,
          details: error.message,
        },
        { status: 500 }
      );
    }
    insertedIncomes += group.length;
  }

  // Persist "remember this" categorizations as user rules (win over seeds).
  const rememberRows = expenseRows.filter(
    (row) => row.rememberRule && row.categoryId
  );
  if (rememberRows.length > 0) {
    const uniqueRules = new Map<string, { pattern: string; categoryId: string }>();
    for (const row of rememberRows) {
      const pattern = normalizeForMatch(row.description);
      if (pattern) uniqueRules.set(pattern, { pattern, categoryId: row.categoryId! });
    }
    const { error } = await supabase.from("categorization_rules").upsert(
      [...uniqueRules.values()].map((rule) => ({
        user_id: userId,
        match_type: "merchant_keyword" as const,
        pattern: rule.pattern,
        category_id: rule.categoryId,
        priority: 5,
        source: "user" as const,
      })),
      { onConflict: "user_id,match_type,pattern" }
    );
    if (error) {
      console.error("Failed to persist categorization rules", error);
    }
  }

  const counts = {
    new_count: insertedExpenses + insertedIncomes,
    duplicate_count: rows.filter((row) => row.status === "duplicate").length,
    uncategorized_count: skippedUncategorized,
  };

  const { error: updateError } = await supabase
    .from("import_batches")
    .update({
      status: "committed",
      committed_at: new Date().toISOString(),
      rows: rows as unknown as Database["public"]["Tables"]["import_batches"]["Update"]["rows"],
      ...counts,
    })
    .eq("id", batch.id)
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json(
      {
        error: "Rows inserted but batch status update failed",
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    insertedExpenses,
    insertedIncomes,
    skippedDuplicates: counts.duplicate_count,
    skippedUncategorized,
  });
}
