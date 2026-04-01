# 2026-04-01 — Investments split into section pages (Stocks and Savings)

## Summary
- Refactored `Investments` so `Stocks` and `Savings accounts` are independent pages inside the investments module.
- Removed the mixed single-page tab layout as the default entry surface.

## Product Changes
- Added dedicated route page: `/investments/stocks` with its own stocks tracking panel (overview, orders, cash, watchlist).
- Added dedicated route page: `/investments/savings` with its own savings tracking panel (balance metrics, transfers table, account management).
- Added section switcher component (`Stocks` / `Savings accounts`) at the top of both pages.
- Updated `/investments` to redirect to `/investments/stocks` so existing navigation links keep working while using the split-page architecture.

## Data Model
- No schema changes.
- No new Supabase migrations required.

## Validation
- `npm run lint` passes (warnings only, pre-existing warnings retained).
- `npm run build` passes.
