# Home hero + Metas-style Presupuesto cards

## Summary

Reworked Home (desktop + mobile) around a navy month-summary hero and Metas-style Presupuesto cards. Hero remaining uses `income − spent` (not checkpoint balance). Category donut keeps legend percentages and DB colors; callout connector lines are off.

## Product Changes

- Replaced the Income / Spent / Available / Giving stat row with `HomeSummaryCard`: remaining, income received, spent, used %, pace bar + calendar marker, daily spend guide, pace status.
- Presupuestos on Home (and Budget overview via shared `BudgetPaceChart`) use Metas-style horizontal cards with compact usage-band rings; carousel of ≤3 per page unchanged.
- Donut title: “Tus gastos por categoría” / “Your spending by category”; `calloutCount={0}` (no leader lines).
- Metas (contribution goals) deferred; dual-engine note documented in design/APP.

## Data Model

No schema changes. Hero math in `src/lib/home/month-cashflow.ts` (cents-friendly helpers). Income base: plan when set, else recorded.

## Validation

- Current month: remaining, used %, pace marker, and daily amount follow the documented formulas.
- Past month: month progress = 100%; daily divisor floors at 1.
- No income: hero shows — without dividing by zero.
- >3 Presupuestos: swipe carousel + dots still work.
- Donut: no connectors; legend % intact; category colors unchanged.
- Desktop hero: remaining/income/spent match mockup scale; ring uses white arc (not green) with “of budget used” / “del presupuesto utilizado”.
