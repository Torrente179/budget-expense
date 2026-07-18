# Import Banco de Occidente January-June statements

## Summary

- Added a reproducible Banco de Occidente PDF statement parser and Supabase import generator.
- Extracted the six statements in the requested order: `ExtractoOccidente.pdf`, then `(1)` through `(5)`.
- Added a row-level audit CSV and an idempotent SQL import for `doralisderamirez@gmail.com`.

## Product Changes

- Prepared 324 expenses and 201 income entries in COP for January through June 2026.
- Kept statement transaction descriptions and dates verbatim.
- Categorized Colombian merchants using the closest existing app category; generic outgoing bank transfers and unidentified electronic-service payments remain `Other`.
- Preserved legitimate identical statement rows, including repeated interest credits, while preventing extra copies if the SQL is rerun.

## Data Model

- No schema changes.
- The generated SQL targets the existing `expenses`, `income_entries`, and `categories` tables.

## Validation

- Visually reviewed all 13 rendered PDF pages.
- Reconciled every statement against its printed debit count, credit count, debit total, credit total, opening balance, and closing balance.
- Reconciled 525 total statement rows: 324 debits totaling COP 33,010,928.68 and 201 credits totaling COP 36,135,191.07.
- Ran `python3 -m py_compile scripts/generate_occidente_import.py` and `git diff --check` successfully.
- Resolved `doralisderamirez@gmail.com` to Auth user `a9e46715-ab7d-4ab9-8b8f-9b0fd6d67cf2` and applied the import to the live Supabase project.
- Queried the live database month by month; all six expense/income counts and totals match their respective printed statement summaries exactly.
- Reran the import and confirmed the live totals remained 324 expenses / COP 33,010,928.68 and 201 incomes / COP 36,135,191.07, validating duplicate-safe idempotency.
- Confirmed the target profile base currency is `COP`.
