# Fix Analytics Card Layout

## Summary

Redesigned the bottom section of the Analytics page for a premium, balanced layout. Monthly Report is now full-width with a 2-column category grid. Giving and Income sit side-by-side below at matching heights.

## Product Changes

- **Monthly Report** → full width with categories in a responsive 2-column grid on desktop. Capped at top 5 categories with a "+N more" summary row (full breakdown already lives in the pie chart above).
- **Giving Insights + Income Sources** → side-by-side `lg:grid-cols-2` layout, similar content height for visual balance.
- Income source names properly truncate with `min-w-0` + `truncate` to prevent text overflow.

## Validation

- `next build` passes with no errors.
- Responsive: single-column on mobile, 2-column grid on desktop.
