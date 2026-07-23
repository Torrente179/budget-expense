# Fix spending donut and Home feed

## Summary

Restored the visible spending donut ring and removed the unsolicited weekly attention card from Home.

## Product Changes

- Donut segments now render as explicit SVG arc paths instead of dashed circles, preventing the ring from disappearing while keeping hover, keyboard, and click behavior.
- Removed the “This week / Worth a look” attention card from the Home screen.
- Kept the five largest category callouts and the full-spending remainder segment.

## Data Model

No data model changes.

## Validation

- TypeScript type check.
- Targeted ESLint checks for the changed components.
- Production build.
- Mobile-width browser inspection of the donut ring and callout layout.
