## Summary

Enabled category drill-down from the dashboard spending mix card so clicking a category opens the existing category detail view filtered to that category and month.

## Product Changes

- Dashboard `By category` rows now navigate to the category detail page.
- Dashboard donut slices now also navigate to the same category detail page.
- Category detail navigation now preserves context with a back action that returns to the originating page when possible.
- Analytics category drill-down links now mark their origin as well so the shared detail page can label the back action correctly.

## Data Model

No database or schema changes.

## Validation

- Verified the dashboard category card now passes a drill-down handler.
- Verified the category breakdown component routes both list rows and donut slices when a click handler is provided.
- Verified the category detail page still filters by `categoryId`, `month`, and `year`, and now falls back to the correct parent page when direct-opened.
