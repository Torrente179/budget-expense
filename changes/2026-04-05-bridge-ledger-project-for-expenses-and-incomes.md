# 2026-04-05 — Bridge ledger project for expenses and incomes

## Summary
- Added a server-only Supabase service-role client for the ledger project referenced by the provided admin key.
- Switched expense and income reads/writes to resolve the logged-in app email against the ledger project, then query that ledger directly.
- Kept the existing public auth flow intact so the app can still use the current login while rendering the imported data from the real source project.

## Product Changes
- `/expenses` now renders against the ledger project that actually contains the imported Santander history.
- Expense create, update, and delete requests now write to the same ledger project instead of the stale public-project connection.
- Income API requests now read and write against the same bridged ledger project, removing the old split-project mismatch for those flows.

## Data Model
- No schema changes.
- Added server-only environment usage for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to access the ledger project admin API and public tables.

## Validation
- Confirmed the provided service-role key belongs to project ref `bahkswifojxcnesfcqbs`.
- Confirmed imported March 2026 expenses exist in `bahkswifojxcnesfcqbs` for user `36534d1b-8f48-4b5c-8693-aae1673a222c`.
- Confirmed the same service-role key is invalid for the app’s old public project ref `awpygbfocmynxpadpsji`, proving the split-project configuration.
