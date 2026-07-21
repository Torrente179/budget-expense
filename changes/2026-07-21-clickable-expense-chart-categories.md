# 2026-07-21 — Make every expense chart category clickable

## Summary
Home “Where it went” donut no longer rolls leftover spend into a non-clickable synthetic “Other” slice. Every category with spend is listed and opens its monthly charges. Insights monthly report similarly shows all categories instead of truncating after five.

## Product Changes
- Home category donut: all spent categories are clickable (including the real **Other** / Otros category).
- Insights monthly report spending bars: all categories are listed and navigate to category detail.

## Data Model
No schema changes.

## Validation
- Synthetic `id: "other"` bucket and `nonInteractiveIds={["other"]}` removed from home chart.
- Clicking Other (or any other category) routes to `/insights/categories/{id}?month=&year=&from=dashboard`.
