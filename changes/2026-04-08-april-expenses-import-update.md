# 2026-04-08 — April Expenses Import Update

## Summary
Regenerated `import-expenses.sql` from the latest Santander CSV export (`movimientos (1).csv`) covering April 1–7, 2026. Improved the import script's category pattern rules to correctly classify Anthropic, Google Cloud, TGTG, and Tenerife-specific merchants.

## Product Changes
- **39 expense rows** staged for April 2026 (dates: Apr 1, 2, 6, 7).
- **3 income/refund rows** staged (2 Teleferico refunds + 1 transfer from Federica Busco).
- SQL is idempotent — safe to re-run without duplicating existing rows.

## Data Model
- No schema changes.
- Script pattern rules updated:
  - Added `anthropic` to Subscriptions (was falling through to Groceries via bank's "Supermercado" label).
  - Added `google *cloud` to Subscriptions.
  - Added `tgtg`, `toogoodtogo`, `montaditos`, `sidreria`, `7 canadas`, `teleferico`, `menester` to Food & Dining.

## Validation
- `python3 scripts/generate_santander_import.py --csv "movimientos (1).csv" --output import-expenses.sql`
- Output: 39 expenses, 3 income/refunds, 0 skipped transfers.
- Verified Anthropic charge (EUR 4.50) now categorized as Subscriptions.
- Verified Google Cloud (EUR 1.15) now categorized as Subscriptions.
