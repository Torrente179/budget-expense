# Restore full spending donut

## Summary

Restored the spending chart to the version with the compact donut and the complete category detail list.

## Product Changes

- The donut once again includes every spending category for the selected month.
- Restored the category list below the donut with color, name, percentage, and amount.
- Hovering or focusing a segment still shows its category in the center.
- Clicking a segment or category row still opens that category’s movements for the selected month.
- The removed weekly attention card remains removed.

## Data Model

No data model changes.

## Validation

- Compared the donut component and Home wiring with commit `6444757`.
- TypeScript type check.
- Targeted ESLint checks.
- Production build.
