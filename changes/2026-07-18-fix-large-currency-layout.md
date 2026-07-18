# Fix large currency layout

## Summary

Prevented large currency values, especially COP amounts, from truncating or
crossing the bounds of dashboard cards and charts.

## Product Changes

- Summary tiles now scale their amount typography to the tile width and always
  show the complete financial value.
- Donut centers render the exact number and currency on separate, centered
  lines inside a slightly wider inner opening.
- Donut legends and budget-objective rows can wrap at deliberate boundaries
  instead of overflowing or forcing neighboring labels out of alignment.

## Data Model

No data model changes.

## Validation

- Targeted ESLint and `npx tsc --noEmit` passed without errors.
- `npm run build` passed: production compilation, TypeScript, and all 49 static
  pages completed successfully.
- A temporary local preview rendered the reported million-scale COP scenarios;
  the DOM overflow audit found no overflowing visible content, and the preview
  route was removed before handoff.
