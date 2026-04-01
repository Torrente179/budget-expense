# 2026-04-01 — Total panel with incomes, net balance, and negative expense impact

## Summary
- Added a full **Income** flow (create, edit, delete, filter) so gains are tracked alongside expenses.
- Added a new **Total** panel (`/available-now`) focused on mobile-first visibility of income, expenses, net available balance, analytics, and recent activity.
- Updated balance math to treat expenses as deductions: **available = total income - total expenses** (can be negative).
- Updated dashboard cumulative charts so expense impact is represented as negative movement in the running total.
- Refined navigation so mobile bottom tabs keep `Dashboard`, `Total`, `Expenses`, `Incomes`, `Budgets`, `Investments`, while `Settings` and `Wisdom` stay in side navigation.
- Removed the `Envelopes assigned` summary card from dashboard metrics.

## Product Changes
- Added income CRUD UI:
  - `src/app/(app)/incomes/page.tsx`
  - `src/components/incomes/income-form.tsx`
  - `src/components/incomes/income-table.tsx`
  - `src/components/incomes/income-filters.tsx`
  - `src/hooks/use-incomes.ts`
- Added Total panel:
  - `src/app/(app)/available-now/page.tsx`
- Added mobile command/search navigation to support terms like `disponible ahora` and route to `Total`:
  - `src/components/layout/mobile-command-palette.tsx`
  - integrated in `src/components/layout/topbar.tsx`
- Added a combined income+expense icon for `Total` nav entry:
  - `src/components/layout/total-nav-icon.tsx`
- Updated nav structures:
  - `src/components/layout/mobile-nav.tsx`
  - `src/components/layout/sidebar.tsx`

## Data and Calculation Changes
- Extended monthly summary to include:
  - `totalIncome`
  - `availableBalance`
- Updated dashboard cards and mobile overview to use net balance semantics.
- Updated chart accumulation logic so expenses reduce cumulative value:
  - `src/components/dashboard/spending-chart.tsx`
  - `src/components/dashboard/mobile-dashboard-overview.tsx`

## Database and Types
- Added `income_entries` table with indexes and RLS policies.
- Added `updated_at` trigger for `income_entries`.
- Updated generated database types and validations for income forms.

## Verification
- `npm run build` passes.
- `npm run lint` runs with existing project warnings only (no new lint errors introduced by this change).
