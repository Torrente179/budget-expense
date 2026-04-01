# 2026-04-01 — Recurring monthly charges

## Summary
- Added recurring monthly charge rules that automatically post into the expense ledger.
- Added Expenses-page UI to create, edit, pause, and delete recurring charges.
- Synced recurring postings into both expense lists and monthly dashboard summaries.

## Data & Logic
- Added `recurring_expenses` table, indexes, update trigger, and RLS policies in `supabase/migration.sql`.
- Added `recurring_expense_id` and `recurring_month` fields on `expenses` with a uniqueness index to prevent duplicate monthly postings.
- Added incremental SQL migration at `supabase/migrations/2026-04-01-recurring-monthly-charges.sql` for existing databases.
- Added shared recurring sync utilities in `src/lib/recurring-expenses.ts`.

## Product Changes
- New recurring charge manager on `/expenses`.
- New recurring charge composer (sheet) with amount, category, debit day, start date, and active toggle.
- Account deletion now also clears recurring charge rules.

## Verification
- `npm run lint` passes (existing warnings only).
- `npm run build` passes.
