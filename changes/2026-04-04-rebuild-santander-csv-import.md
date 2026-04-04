# 2026-04-04 — Rebuild Santander CSV import

## Summary
- Replaced the incomplete one-off Santander CSV SQL dump with a reproducible generator script and a regenerated import file.
- The new import covers the full `movimientos.csv` range from September 2025 through April 2026 instead of the previous partial slice.
- The generated SQL is idempotent and can resolve the target auth user automatically when the project only has one user.

## Product Changes
- Rebuilt [import-expenses.sql](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/import-expenses.sql) from the current Santander export so the frontend can receive the full CSV history once the script is run in Supabase.
- Expanded the import scope to include:
  - expense rows from `Gasto` debits
  - income rows from `Ingreso`
  - refund rows from positive `Gasto` entries
- Internal transfer rows marked `No computable` are still skipped because there is no dedicated transfer ledger in the product.

## Data Model
- Added [scripts/generate_santander_import.py](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/scripts/generate_santander_import.py) to generate Supabase SQL from a Santander `movimientos.csv` export.
- The generated SQL ensures default categories exist, creates required user-scoped categories when needed, and inserts rows into:
  - `public.expenses`
  - `public.income_entries`
- Import deduplication is based on stable row content so the SQL can be re-run safely without blindly duplicating records.

## Validation
- `python3 -m py_compile scripts/generate_santander_import.py`
- `python3 scripts/generate_santander_import.py --csv /Users/juanpabloramirez/Downloads/movimientos.csv --output import-expenses.sql`
- Generated counts:
  - `664` expense rows
  - `67` income/refund rows
  - `7` skipped internal transfer rows
