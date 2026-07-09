/**
 * The canonical 5-field identity used to detect duplicate ledger rows.
 *
 * This must stay byte-compatible with:
 * - the LEFT JOIN dedupe in scripts/generate_santander_import.py (SQL output)
 * - the grouping key in /api/admin/deduplicate
 * so the Python script path and the in-app import path skip each other's rows.
 */
export interface ExpenseDedupeFields {
  amount: number | string;
  date: string;
  description: string | null | undefined;
  category_id: string;
  currency: string;
}

export interface IncomeDedupeFields {
  amount: number | string;
  date: string;
  description: string | null | undefined;
  source: string;
  currency: string;
}

/** Amounts must compare equal regardless of "12.5" vs 12.50 representations. */
function normalizeAmount(amount: number | string): string {
  return Number(amount).toFixed(2);
}

export function buildExpenseDedupeKey(fields: ExpenseDedupeFields): string {
  return [
    normalizeAmount(fields.amount),
    fields.date,
    fields.description ?? "",
    fields.category_id,
    fields.currency,
  ].join("|");
}

export function buildIncomeDedupeKey(fields: IncomeDedupeFields): string {
  return [
    normalizeAmount(fields.amount),
    fields.date,
    fields.description ?? "",
    fields.source,
    fields.currency,
  ].join("|");
}
