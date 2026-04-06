# Apply Movimientos Mobile Header Style Site-Wide

## Summary

Replicated the compact mobile header layout introduced in Movimientos across all pages that use `PageHeader`. Also cleaned up stale navigation links in the dashboard mobile overview that still pointed to the now-merged `/expenses` and `/incomes` routes.

## Product Changes

- **`PageHeader` component**: On mobile, title and action buttons now render inline on the same row (title left, actions right), matching the Movimientos header pattern. Description is hidden on mobile and only shown on desktop (`lg:block`). Title size reduced from `text-3xl` to `text-[1.75rem]` on mobile; desktop size unchanged at `text-[2.45rem]`.
  - Affects: Dashboard, Available Now, Budgets, Investments/Stocks, Wisdom, Settings.

- **Dashboard mobile quick actions**: Updated from 4 items (Budget / Income→`/incomes` / Expense→`/expenses` / Invest) to 3 items (Budget / Movimientos→`/movimientos` / Invest). Grid changed from `grid-cols-4` to `grid-cols-3`.

## Validation

- Build passes with no TypeScript or compilation errors.
- No children rendered twice — single DOM tree with responsive Tailwind classes handles both mobile and desktop layouts.
- All pages using `PageHeader` inherit the update automatically with no per-page changes needed.
