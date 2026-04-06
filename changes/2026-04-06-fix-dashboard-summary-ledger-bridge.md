# 2026-04-06 — Fix dashboard summary to read from ledger project

## Summary
The dashboard panel was showing empty data for all cards except "Gastos recientes" and "Inversiones" because `useMonthlySummary` queried expenses and incomes directly via the browser Supabase client, which points to the old app project. The actual data lives in the ledger project since the bridge migration.

Created a `/api/dashboard/summary` server route that queries expenses and incomes from the ledger project (via service-role client) while still reading budgets, monthly plans, and investment transfers from the app project. Updated the `useMonthlySummary` hook to call this API route instead of querying Supabase directly from the browser.

## Product Changes
- Dashboard summary cards (total spent, total income, available balance, category breakdown, spending chart, mobile overview) now correctly display data from the ledger project.
- No visible UI changes — the same cards now work again.

## Data Model
- No schema changes.

## Validation
- `next build` succeeds with no type errors.
