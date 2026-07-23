# Movements category filter

## Summary

Added a category select to Movements so expenses can be filtered by category alongside text search. Selection is URL-backed (`?categoryId=`) and reuses the existing expense query filter.

## Product Changes

- Movements search/filter area includes an “All categories” select with expense categories (icons + localized names).
- Desktop: select sits next to the search field in the header.
- Mobile: select stays visible under the header (and under the expanded search field when open).
- Choosing a category filters expenses server-side, hides incomes, and updates the summary to that category’s spend.
- Switching to the Income tab clears the category filter; choosing a category from Income switches to Expenses.

## Validation

- Manual: open `/movements`, pick a category, confirm only matching expenses show and totals update; clear via “All categories”; combine with text search and month picker.
- Deep link: `/movements?tab=expenses&categoryId=<uuid>` should restore the filter.
