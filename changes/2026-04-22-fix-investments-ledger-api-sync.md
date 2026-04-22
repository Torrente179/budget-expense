# Summary

Moved the investments frontend off direct browser Supabase table access and onto a server-backed investments API that resolves the effective ledger user before reading or mutating brokerage, trade, cash, watchlist, and savings records.

# Product Changes

- Added a new `/api/investments` route handler that serves the full investment snapshot and handles create, update, and delete operations for brokerage accounts, trades, cash movements, savings accounts, savings transfers, and watchlist entries.
- Updated `useInvestments` to fetch and mutate through the new API instead of querying investment tables directly from the browser.
- Updated `useInvestmentSavings` to use the same investments API so savings transfers stay aligned with the ledger-side user mapping too.

# Data Model

- No schema changes.
- Existing `brokerage_accounts`, `investment_assets`, `investment_trades`, `investment_cash_movements`, `investment_watchlist`, `investment_savings_accounts`, and `investment_savings_transfers` tables are now accessed through the server route when used from the frontend.

# Validation

- `npm run lint -- src/app/api/investments/route.ts src/hooks/use-investments.ts src/hooks/use-investment-savings.ts src/lib/investments-api-client.ts`
- `npm run build`
