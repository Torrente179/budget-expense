# Fix method seeding confirm + RPC category_ids

## Summary

Replaced the native browser confirm when applying a budgeting method with an in-app dialog, and fixed seeding failures caused by a bad UUID cast in `replace_custom_budget_set`.

## Product Changes

- Applying a method with existing budgets opens a proper app dialog (“¿Reemplazar presupuestos?”) instead of `window.confirm`.
- Seed failures fall back to the client insert path so creating budgets works even before the SQL fix is applied.

## Data Model

- Migration `2026-07-24-fix-replace-custom-budget-set-category-ids.sql`: use `jsonb_array_elements_text` when linking `category_ids`.

## Validation

- Budget → Methods → apply 50/30/20 with 1 existing budget → in-app confirm → budgets replaced, no native browser dialog, no error toast.
- Cancel on the dialog leaves existing budgets unchanged.
