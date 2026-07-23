# Fix donut callout connector

## Summary

Removed the triangular-looking double line from near-horizontal donut callouts such as “Travel”.

## Product Changes

- Callouts use one clean connector segment when their optional elbow would overshoot and turn back toward the label.
- Other callouts keep their standard two-segment connector.
- Donut categories, colors, labels, interactions, and the full detail list are unchanged.

## Data Model

No data model changes.

## Validation

- TypeScript type check.
- Targeted ESLint check.
- Production build.
- Mobile-width browser inspection with “Travel” among the five labeled categories.
