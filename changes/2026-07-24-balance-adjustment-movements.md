# Balance adjustment movements

## Summary

- When reconciling available balance, a non-zero surplus or deficit is now booked as a ledger movement on the reconciliation date.
- Surplus creates an income; deficit creates an expense, using standard bilingual names.

## Product Changes

- Settings balance reconciliation still saves a checkpoint, and also records:
  - Income for surplus (`Opening balance surplus` / `Superávit del saldo inicial`, or `Reconciliation surplus` / `Superávit de conciliación`)
  - Expense for deficit (`Opening balance deficit` / `Déficit del saldo inicial`, or `Reconciliation deficit` / `Déficit de conciliación`)
- Movements and calendar lists localize those standard names to the active language.
- Copy now states that surplus/deficit becomes income/expense instead of saying reports are unchanged.

## Data Model

- No schema change. Adjustment rows use existing `income_entries` / `expenses` tables.
- The movement is inserted before the checkpoint so same-day `created_at` ordering keeps it inside the checkpoint baseline and does not double-count tracked available balance.
- If checkpoint insert fails, the adjustment movement is rolled back.

## Validation

- Added unit coverage for surplus/deficit label selection and bilingual translation.
- `npm run test:balance` and targeted TypeScript/lint checks for touched files.

## Documentation

Product and architecture docs were synced in
`changes/2026-07-24-document-balance-adjustment-movements.md`
(`docs/APP.md`, `Architecture/` §§ 03, 04, 06, 10, README).
