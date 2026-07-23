# Top-five spending donut labels

## Summary

Updated the Home spending donut to emphasize the five categories with the highest spending for the selected month.

## Product Changes

- The five largest spending categories are sorted by amount and labeled around the donut with their names and percentage shares.
- Spending outside the top five is combined into a muted remainder segment so the ring and center total still represent all monthly spending.
- Category segments retain their hover, keyboard, and click-through behavior.
- The aggregated remainder is informational and does not navigate to a category.

## Data Model

No data model changes.

## Validation

- TypeScript type check.
- Targeted ESLint checks for the changed components.
- Production build.
- Responsive browser inspection where an authenticated local session is available.
