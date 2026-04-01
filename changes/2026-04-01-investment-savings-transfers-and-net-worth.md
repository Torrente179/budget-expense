# 2026-04-01 — Investment savings accounts, transfer tracking, and multi-currency net worth

## Summary
- Expanded `Investments` with a dedicated `Savings` surface alongside existing `Stocks` workflows.
- Added savings-account configuration for Colombia and Spain banks/products.
- Added transfer tracking from main balance to savings accounts and integrated this flow into `Expenses` and `Total`.
- Added investment net-worth totals converted to `USD`, `EUR`, and `COP` using the daily FX rates.

## Data Model
- Added `investment_savings_accounts` table with:
  - `country_code`, `bank_code`, `bank_name`
  - `product_type`, `product_name`
  - `account_name`, `currency`
- Added `investment_savings_transfers` table with:
  - destination savings account reference
  - transfer amount/currency/date
  - optional notes and `source_kind` (`manual`, `expense_flow`)
- Added indexes, `updated_at` triggers, RLS enablement, and policies for both tables.
- Added incremental migration: `supabase/migrations/2026-04-01-investment-savings-accounts.sql`.
- Updated full schema reference in `supabase/migration.sql`.

## Product Changes
- Updated `/investments`:
  - New `Savings` tab with account CRUD and transfer CRUD.
  - Savings summary card set (balance, account count, movement count).
  - Net worth panel combining stocks + savings and converted totals in `USD/EUR/COP`.
- Updated dashboard investment snapshot to include tracked savings balances.
- Updated `/expenses`:
  - Added `investment movement` composer (transfer to savings) from expense flow.
  - Added savings-transfer tracking table in the expenses page.
- Updated `/available-now`:
  - Available total now subtracts investment transfers.
  - Activity feed and cumulative net chart now include investment transfers as outflows.
  - Added quick action to send money directly to savings accounts.
- Updated monthly summary logic so available balance and daily movement calculations include investment transfers.

## Validation
- `npm run lint` passes (warnings only, existing project warnings retained).
- `npm run build` passes.
