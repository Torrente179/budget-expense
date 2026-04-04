# 2026-04-04 — Prefill Santander import user id and legacy category compatibility

## Summary
- Prefilled the regenerated Santander CSV import SQL with the confirmed Supabase auth user id so it can be run directly without manual UUID edits.
- Adjusted the generator and generated SQL so custom import categories are created as global rows when the live database rejects user-scoped category inserts through the legacy `categories_user_id_fkey`.

## Product Changes
- No frontend or UX behavior changed.

## Data Model
- Updated [import-expenses.sql](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/import-expenses.sql) to set `v_uid` to `36534d1b-8f48-4b5c-8693-aae1673a222c`.
- Updated [scripts/generate_santander_import.py](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/scripts/generate_santander_import.py) so custom categories (`Taxes`, `Professional Services`, `Donations`, `Personal Care`) are inserted as global categories and still resolve correctly during the staged expense import.

## Validation
- Confirmed the generated SQL now defaults to the target auth user at the top of the file.
- Confirmed the generated SQL inserts custom categories with `user_id = NULL` and resolves category ids from visible global rows.
