# 2026-04-01 — Investments ledger with Colombian stocks

## Summary
- Added a dedicated `Investments` module with overview, orders, cash movements, and watchlist tabs.
- Added a portfolio snapshot card to the main dashboard without mixing investment metrics into the budget ledger.
- Kept `v1` manual-first while supporting broker-first entry across `Interactive Brokers`, `Hapi`, `Trii`, and custom brokers, plus US stocks, US ETFs, `BTC`, `ETH`, and Colombian stocks.

## Data Model
- Added `brokerage_accounts`, `investment_assets`, `investment_trades`, `investment_cash_movements`, `investment_watchlist`, and `market_price_history` to `supabase/migration.sql`.
- Added indexes, `updated_at` triggers, and RLS policies for all new user-owned investment tables.
- Extended manual Supabase types in `src/types/database.ts`.

## Market Data
- Added `src/app/api/market-prices/route.ts` for daily historical/latest quote lookups.
- Added `src/lib/market-data.ts` with a deterministic provider order:
  - `Twelve Data` for US assets and `BTC` / `ETH`
  - `EODHD` fallback for assets with explicit fallback symbols, including Colombian equities when configured
- Added DB-backed quote caching in `market_price_history`.
- Quote lookup never blocks manual trade entry; it only enriches the form with editable reference pricing.

## Product Surface
- Added `/investments` with:
  - Overview cards and holdings table
  - Manual order ledger with editable reference-price autofill
  - Cash deposit/withdrawal tracking
  - Watchlist tracking
  - Broker management with lightweight auto-created broker entries from position or cash saves
- Added `Investments` navigation to desktop and mobile shells.

## Broker-First Flow
- Positions and cash movements no longer require a broker row to be created first.
- Selecting a broker in the form now auto-creates the saved broker entry if it does not already exist.
- Expanded the built-in broker list to include popular options such as `Trii`, `Fidelity`, `Charles Schwab`, `Robinhood`, `eToro`, `Trading 212`, `DEGIRO`, `XTB`, and `Alpaca`.
- Generalized the `broker_kind` schema from the original `IBKR` / `HAPI` restriction so custom brokers can persist.

## Portfolio Logic
- Added FIFO lot accounting in `src/lib/investments.ts`.
- Buy fees are included in cost basis.
- Sell fees reduce proceeds.
- Realized and unrealized P&L, estimated cash, and net contributions are computed on read from immutable trade/cash records.

## Notes
- Colombian quote coverage is `best effort` in `v1`.
- If a Colombian symbol needs automatic pricing before a dedicated provider is added, supply the EODHD symbol in the asset metadata fields.
- Environment variables used by the new market-data layer:
  - `TWELVE_DATA_API_KEY`
  - `EODHD_API_KEY`

## Verification
- `npm run lint` passes.
- `npm run build` passes.
