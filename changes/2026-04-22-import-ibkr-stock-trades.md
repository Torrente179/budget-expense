# 2026-04-22 — Import IBKR stock trades

## Summary
- Imported the visible Interactive Brokers stock trades from the supplied screenshot set into the live Supabase investment ledger.
- Excluded all dividends, payments, and cash movements.
- Created the `Interactive Brokers` brokerage account and stored the imported rows with `source_kind = 'ibkr_import'`.

## Product Changes
- Added `19` IBKR stock trades to the investment portfolio.
- Current imported net share quantities from those screenshots are:
  - `GOOG`: `15`
  - `MSFT`: `2`
  - `NICE`: `5`
  - `NVDA`: `26`
  - `ONDS`: `35`
  - `PLUG`: `1`
  - `RCAT`: `25`
  - `RIG`: `150`
  - `SIDU`: `60`
  - `WOLF`: `0.8469`
- `MSTR` currently shows as a standalone sell (`-1` net quantity) because the matching earlier buy is outside the provided screenshot range. That keeps the order history present, but realized P&L will remain incomplete until the earlier basis trade is added.

## Data Model
- No schema changes.
- Inserted live data into:
  - `public.brokerage_accounts`
  - `public.investment_assets`
  - `public.investment_trades`
- All imported trades use:
  - `execution_currency = 'USD'`
  - `fee_currency = 'USD'`
  - `source_kind = 'ibkr_import'`

## Validation
- Verified there was no existing investment ledger for the user before import.
- Inserted `19` trade rows into the `Interactive Brokers` account.
- Confirmed no dividend rows or cash movement rows were imported.
- Confirmed the resulting net quantities directly from Supabase after insert.
- Residual gap:
  - the `Jan 01, 2026 - Apr 22, 2026` screenshot header says `14 trade(s)`, but only `13` trade rows are visible across the provided 2026 screenshots, so one 2026 IBKR trade may still be offscreen and not yet imported.
