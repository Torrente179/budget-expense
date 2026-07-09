# 2026-06-08 - Refresh Santander movements

## Summary
- Refreshed the Santander movement import from `/Users/juanpabloramirez/Downloads/movimientos (3).csv`.
- Extended the importer classification and cleanup rules for the latest export.

## Product Changes
- Staged settled Santander activity through June 8, 2026.
- Community contributions now appear under `Donations`.
- Bizum payments mentioning `hamburguesa` now appear under `Food & Dining`.
- Standard outgoing transfers now receive concise `Transfer to ...` descriptions.

## Data Model
- No schema changes.
- Regenerated `import-expenses.sql` as an idempotent ledger import.

## Validation
- `python3 -m py_compile scripts/generate_santander_import.py`
- `python3 scripts/generate_santander_import.py --csv '/Users/juanpabloramirez/Downloads/movimientos (3).csv' --output import-expenses.sql --user-id 36534d1b-8f48-4b5c-8693-aae1673a222c`
- Generated `185` expense rows and `9` income/refund rows; skipped `2` internal transfers.
- Live ledger sync was retried on June 23, 2026 after the database was reported resumed, but the current execution environment cannot resolve Supabase hosts (`bahkswifojxcnesfcqbs.supabase.co` or `supabase.com`), so the live import has not been executed from Codex.
- Removed the stale hardcoded ledger user id from `import-expenses.sql`; the script now resolves the target user automatically when the project has one auth user.
- Set `v_user_email` to `pablopablo179@gmail.com` after confirming the active Supabase project is `awpygbfocmynxpadpsji` (`Budget-Expense` / `Torrente179`).
- Added a defensive `income_entries` table bootstrap to the import because the active Supabase project was missing that table.
