# Category drill-down from Analytics

## Summary

Added a dedicated category detail page (`/analytics/category/[id]`) that shows all expenses for a specific category in a given month. Made all category references across the Analytics page clickable — category breakdown pie chart list, budget performance envelopes, and monthly report spending bars — so users can drill down into any category's expenses.

## Product Changes

### Category detail page (`/analytics/category/[id]`)
- **Category header** — icon, name, month label, total spent, and transaction count badge.
- **Budget progress** — if the category has a budget, shows spent vs budgeted with color-coded progress bar and "Over" badge when exceeded.
- **Expense list** — all expenses for that category in the month, grouped by date (descending), with edit and delete functionality (reuses existing `ExpenseForm`).
- **Multi-currency** — shows original currency conversion when expense currency differs from base currency.
- **Back navigation** — link back to the Analytics page.
- Month/year passed via query params (`?month=4&year=2026`).

### Clickable categories in Analytics
- **Category breakdown** (pie chart section) — each category row is now clickable; navigates to the category detail page.
- **Budget performance** (envelope utilization) — each envelope row is now clickable.
- **Monthly report** (spending by category bars) — each category bar is now clickable.
- All clickable areas have hover states and keyboard accessibility (`role="button"`, `tabIndex`, `onKeyDown`).

### Component changes
- `CategoryBreakdown` — added optional `onCategoryClick` prop.
- `MonthlyReport` — added optional `onCategoryClick` prop.
- Both props are backward-compatible; existing uses (e.g. dashboard) are unaffected.

## Data Model

No database schema changes. Category detail page uses the existing `useExpenses({ categoryId })` filter parameter already supported by the API.

## Validation

- Full Next.js production build passes with zero TypeScript errors.
- Category detail page is fully bilingual (EN/ES).
- Page is fully responsive — expense list and budget progress stack naturally on mobile.
- Edit/delete functionality works inline via existing `ExpenseForm` and delete dialog.
