# Per-budget rings with swipe pages

## Summary

Home “Monthly budgets” shows one pace ring per budget (spent ÷ limit) instead of an aggregate ring plus bars. With more than three budgets, extra rings move onto swipeable pages; each page sizes rings by how many budgets it holds.

## Product Changes

- One ring per budget with name and spent/limit.
- Ring size ladder: 1 → 88px, 2 → 76px, 3 → 64px (and smaller only if a page somehow has 4+).
- Max 3 rings per page; swipe or tap dots for more.
- Pace colors (green / amber / red) and month-progress mark kept; category coloring deferred.

## Validation

- 1–3 budgets: single page, no dots.
- 4+ budgets: snap pages + active page indicator.
- Last page with 1–2 leftover budgets uses the larger size for that count.
