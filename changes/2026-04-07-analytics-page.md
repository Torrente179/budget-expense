# Analytics page with full mobile and desktop integration

## Summary

Added a dedicated Analytics page (`/analytics`) that consolidates all financial analysis features into one place: key metrics, financial ratios, spending charts, category breakdown, budget performance, monthly report, giving insights, and income source analysis. Added Analytics to desktop sidebar, mobile slide-out menu, and mobile bottom tab bar.

## Product Changes

### Analytics page (`/analytics`)
- **Key metrics** — summary cards for spent, income, and available balance with month-over-month delta.
- **Financial ratios** — 4-tile row showing savings rate (vs 20% target), expense-to-income ratio, budget usage %, and transaction count. Fully responsive (2-col on mobile, 4-col on desktop).
- **Spending chart** — cumulative expense impact area chart (reuses existing `SpendingChart`).
- **Category breakdown** — pie chart with top 5 categories (reuses existing `CategoryBreakdown`).
- **Budget performance** — envelope utilization list showing spent vs budgeted per category with color-coded progress bars and "Over" badges for exceeded envelopes.
- **Monthly report** — month-over-month comparison, category spending bars with budget-vs-actual, auto-generated insights (reuses existing `MonthlyReport`).
- **Giving insights** — tzedakah/tithe tracker with 10% benchmark progress (reuses existing `GivingInsights`).
- **Income sources** — bar chart of income by source with percentage of total income.
- **Month picker** — navigate between months.

### Navigation changes
- **Desktop sidebar** — Analytics added between Calendar and Investments.
- **Mobile slide-out menu** — Analytics added between Calendar and Investments.
- **Mobile bottom tab bar** — Analytics replaces Investments in the 4-tab bar (Investments remains accessible via slide-out menu).

## Data Model

No database schema changes. All analytics are derived from existing tables (expenses, income_entries, budgets, monthly_budget_plans) via existing hooks.

## Validation

- Full Next.js production build passes with zero TypeScript errors.
- All sections are bilingual (EN/ES).
- Page is fully responsive — financial ratios use 2-col grid on mobile, budget bars and income bars stack vertically.
- Analytics accessible from all navigation surfaces (sidebar, slide-out, bottom bar).
