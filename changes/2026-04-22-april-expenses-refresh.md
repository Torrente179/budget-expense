# 2026-04-22 — April expenses refresh

## Summary
- Refreshed the April Santander import from `/Users/juanpabloramirez/Downloads/movimientos (2).csv`, which covers settled account activity through April 22, 2026.
- Updated the import classifier so `apple.com/bill` charges land in `Subscriptions` instead of `Shopping`.
- Synced the regenerated April rows into the live Supabase ledger and cleaned up three older normalization duplicates from April 1.

## Product Changes
- April 2026 now contains the settled Santander batch in Supabase:
  - `104` expense rows
  - `7` income/refund rows
- Apple billing charges on April 16 and April 20 now appear under `Subscriptions`.
- Screenshot-only card withholdings were intentionally not imported because they are still pending authorizations and the ledger has no pending-expense state. Importing them now would double count once they settle in a future CSV export.

## Data Model
- No schema changes.
- Updated `scripts/generate_santander_import.py` classification rules for `apple.com/bill`.
- Regenerated `import-expenses.sql` from the latest Santander export.
- Removed three pre-existing April 1 duplicate expense rows that differed only by accent normalization in the description.

## Validation
- `python3 -m py_compile scripts/generate_santander_import.py`
- `python3 scripts/generate_santander_import.py --csv '/Users/juanpabloramirez/Downloads/movimientos (2).csv' --output import-expenses.sql`
- Live Supabase sync results:
  - inserted `65` missing expense rows
  - inserted `4` missing income/refund rows
  - deleted `3` duplicate April 1 expense rows from the April 8 import
- Verified live April totals in Supabase after cleanup:
  - `104` expenses
  - `7` income/refund rows
  - `3449.78 EUR` total expenses
