# 2026-04-01 — Stewardship budget upgrade

## Summary
- Added a monthly income-based budget plan with a default 20% allocation and conversion-aware pool calculations.
- Rebuilt the budgeting, dashboard, and expense-entry experiences around a calmer premium visual system.
- Added a new Spanish `Sabiduría` section with NBLA stewardship themes, practical actions, and attribution.

## Data & Logic
- Added `monthly_budget_plans` schema, indexes, triggers, and RLS policies in `supabase/migration.sql`.
- Extended app database types and validation for monthly income plans.
- Centralized conversion-aware budget math so dashboard totals and budget progress use the same pool logic.

## Product Changes
- Budgets page now leads with the monthly protected pool, remaining amount, consumed progress, and envelope assignment warnings.
- Expenses now use a responsive sheet composer with amount-first entry and live preview.
- Dashboard summary cards, chart surfaces, and recent activity were redesigned to match the new stewardship model.
- Added `/wisdom` with Spanish biblical finance themes and required NBLA attribution.

## Verification
- `npm run lint` passes.
- `npm run build` passes.
