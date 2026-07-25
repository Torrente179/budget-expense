# Santander last-30-days sync

## Summary

- Synced Santander movements from `export_excel 5.xlsx` into `pablopablo179@gmail.com` for 2026-06-20 through 2026-07-20.
- Reconciled against existing ledger rows first (exact date, then ±3 day amount match) so already-entered charges were not duplicated.
- Inserted only the missing expenses and one missing income entry.

## Product Changes

- Added 7 missing expenses with categories aligned to existing app conventions:
  - `APPLE.COM/BILL` → Subscriptions
  - `OMIO` → Travel
  - `NO PIQUI`, `CHIRINGUITO EL`, `HAMBURGUESERIA` → Food & Dining
  - `WWW.AMAZON*QV82U1SL5` → Shopping
  - `MERCADONA COTOM` → Groceries
- Added 1 missing income: Monika `Movistart July` €22.50 on 2026-06-22.
- Left 122 matching expenses and 9 matching incomes untouched.

## Data Model

- No schema changes.
- Import artifacts:
  - `supabase/imports/2026-07-20-santander-last-30-days.sql`
  - `supabase/imports/2026-07-20-santander-last-30-days-audit.csv`

## Validation

- Parsed 139 bank rows in-window (129 expenses, 10 incomes).
- Confirmed duplicate-safe matching for repeated same-amount merchants (e.g. two `CHIRINGUITO EL` €2.50 charges on different days).
- Applied SQL to live app project `awpygbfocmynxpadpsji` for user `36d56f02-711b-4eac-80df-803bdb599828`.
- Verified all 7 expenses and 1 income landed with the expected categories/sources.
- Reran the import; totals stayed at 142 expenses / 10 incomes in the reconciliation window, confirming no duplicates.
