# Budget tab two-column layout

## Summary

Budget screen no longer stacks three full-bleed cards. Desktop matches Home:
budgets (rings) on the left; plan and Giving stacked in a narrow right column.

## Product Changes

- Desktop (`lg+`): left = Your budgets with `BudgetPaceChart` rings + compact
  manage/delete list; right = Your plan + Generosidad.
- Progress bars on plan/Giving capped (`max-w-xs`); no edge-to-edge meters.
- Mobile order: Plan → Budgets → Giving.
- Rings accept `onSelect` on the budget page to open the edit sheet.

## Validation

- Wide desktop: no 1000px+ orange bars across the viewport.
- Tap a ring opens edit; trash in the manage list still deletes.
- Home rings unchanged (still link to `/budget`).
