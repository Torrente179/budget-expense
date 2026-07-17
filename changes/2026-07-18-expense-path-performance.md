# Expense path performance

## Summary

Made expense tracking feel instant by cutting duplicate Home network work, moving recurring sync off read GETs, removing route-remount jank, virtualizing Movements, lazy-loading heavy UI, and hardening Insights/Wealth against large history.

## Product Changes

- Home loads from a single monthly summary request (giving + recent movements included); no parallel full expenses/incomes fetch.
- Adjacent-month prefetch is summary-only on Home and ledger-only on Movements.
- Tab navigation no longer fades/remounts the whole page tree.
- Capture sheet mounts only when opened (FAB and Home quick actions).
- Movements ledger virtualizes rows; swipe actions no longer use per-row framer-motion.
- Review badge uses a count-only endpoint instead of loading the review queue.
- Instant route skeletons for `/home` and `/movements`.
- Insights and Wisdom charts/content load in separate chunks.

## Data Model

- Migrations:
  - Ledger: `2026-07-18-household-insights-aggregates-ledger.sql` (`household_expense_category_aggregates`, `household_income_aggregates`)
  - App: `2026-07-18-household-insights-aggregates-app.sql` (`liability_payment_totals`, `idx_liability_payments_user`)
- Dashboard summary expense/income selects now include ids and fields needed for recent movements / giving.
- New API: `POST /api/recurring/sync`, `GET /api/insights/review/count`, `POST /api/market-prices` (batch).

## Validation

- Typecheck (`tsc --noEmit`) passes.
- Manual checklist: cold open Home → one summary GET; add expense via FAB; scroll dense Movements month; switch months; switch tabs without remount flash; Insights/Wealth still load.
- Apply the ledger + app household aggregate migrations so Insights uses SQL aggregates instead of the row-scan fallback.
