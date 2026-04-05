# 2026-04-05 — Rebuild expenses page around server ledger data

## Summary
- Rebuilt `/expenses` as a server-rendered ledger centered on the imported expense rows instead of the previous client-side read flow.
- Switched the page filters to URL-backed server queries so month, category, and search always reload from the database directly on navigation.

## Product Changes
- `/expenses` now defaults to the latest month with stored expense data for the signed-in user when no explicit month/year is provided.
- The page now focuses on the expense ledger itself and removes the recurring-charge and savings-transfer sections from the main expenses surface.
- Expense filters and edit/create flows now operate against the server-rendered ledger state and refresh the page after changes.

## Data Model
- No schema or migration changes.

## Validation
- `npm run build`
