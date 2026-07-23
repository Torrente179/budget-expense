# Home desktop two-column layout

## Summary

On desktop home, recent movements now sit in the left column at the top, while monthly budgets and the spending donut stack in a narrower right column that shares the same width.

## Product Changes

- Desktop: left column = recent movements; right column = budgets above “Where it went”.
- Mobile order unchanged: budgets → donut → movements.
- Empty-state CTA for budgets stacks vertically so it fits the narrower column.

## Validation

- Confirm at `lg` breakpoint that movements align with the previous budgets top edge.
- Confirm budgets and donut share the same right-column width (`lg:col-span-2`).
- Spot-check mobile: budgets still appear before donut and movements.
