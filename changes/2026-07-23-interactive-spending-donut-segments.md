# Interactive spending donut segments

## Summary

Made the colored segments in the spending donut directly interactive instead of limiting category navigation to the legend rows.

## Product Changes

- Hovering or focusing a donut segment now shows that category name and amount in the center of the chart.
- Clicking a segment opens the existing category movement screen for the selected month.
- Keyboard users can focus a segment and activate it with Enter or Space.
- The active segment is emphasized while the other segments are temporarily dimmed.

## Data Model

No data model changes.

## Validation

- TypeScript, lint, and production build checks.
- Browser interaction check for hover, click navigation, and keyboard activation where an authenticated app session is available.
