# 2026-04-04 — Fix Supabase missing feature tables and PostgREST fallout

## Summary
- Added a catch-up Supabase migration for feature tables that the frontend already queries but that were not consistently available in existing projects.
- Hardened the client data hooks so a missing optional table (`PGRST205`) no longer breaks unrelated screens such as `Expenses` and `Dashboard`.
- Stabilized the browser Supabase client with a singleton so hooks stop recreating clients on every render.

## Product Changes
- `Expenses` and dashboard summary flows now continue loading even if recurring-expense sync or newer optional tables are unavailable.
- Incomes, recurring-expenses, monthly-plan, investments, and savings hooks now fail soft to empty/default state instead of leaving the UI stuck in a broken loading path.
- Browser-side Supabase usage now reuses one client instance instead of constructing a fresh client for each render.

## Data Model
- Added `supabase/migrations/2026-04-04-sync-feature-tables-and-postgrest-cache.sql`.
- The new migration idempotently provisions and re-applies access/policy metadata for:
  - `recurring_expenses`
  - `income_entries`
  - `monthly_budget_plans`
  - `brokerage_accounts`
  - `investment_assets`
  - `investment_trades`
  - `investment_cash_movements`
  - `investment_watchlist`
  - `market_price_history`
  - `investment_savings_accounts`
  - `investment_savings_transfers`
- The migration also refreshes grants and sends `NOTIFY pgrst, 'reload schema'` so PostgREST can reload the API surface after the catch-up run.

## Validation
- `npm run lint` passes with existing project warnings only.
- `npm run build` passes.
- Direct REST verification against the live Supabase project reproduced `PGRST205` on newer feature tables while legacy tables such as `expenses` and `categories` still returned `200`, which guided the catch-up migration and fallback handling.
