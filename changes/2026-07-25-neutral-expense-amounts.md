# Neutral expense amounts

## Summary

Expense / charge amounts now render in black (foreground ink) instead of red/pink. Income stays green. Spending chart series use a neutral slate instead of magenta.

## Product Changes

- Movement ledger charges are black; income remains green with `+`.
- Home / Insights donut center totals and legend amounts are black.
- Spend trend charts use slate (`#64748B`) rather than pink/red.
- Budget “spent” figures and other routine expense totals follow the same neutral treatment.
- Alert semantics that are not charge amounts (e.g. month-over-month spend increase arrows, negative net worth) can still use red.

## Validation

- Movements list: expense amounts black, income green.
- Home spending donut: Gastado total and category amounts black; category slice colors unchanged.
- Insights spend charts: bars/areas slate, not pink.
