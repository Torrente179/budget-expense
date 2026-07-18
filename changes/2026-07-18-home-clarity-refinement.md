# Home clarity refinement: pace bar, category donut, less redundancy

## Summary

Direct response to user feedback that Home felt "a lot but not useful",
especially on mobile. The decorative cumulative-spending sparkline inside the
safe-to-spend hero was confusing (no axis, wrong semantic); the category pie —
the most-used visual — was missing; quick-action chips duplicated the tab bar
and were overlapped by the FAB; and two stat cards showed wrong or dead
content.

## Product Changes

- **Hero**: sparkline removed. Replaced with a spending-pace bar — % of income
  spent, with a tick marking how far into the month we are; fill turns
  success/warning/danger as spending runs ahead of the calendar
  (`src/components/home/home-screen.tsx`, `home-sparkline.tsx` deleted).
- **"Where it went" donut is back on Home**: top-6 categories + Other, colored
  by DB category colors, center total, legend with % and amounts, slice/row
  tap opens the category drilldown. Links to Insights for the full analysis.
- **Stat row fixes**: the expense count is no longer mislabeled under Income
  ("65 movimientos"); Income shows a neutral caption; when no monthly plan
  exists, the dead "Plan usado —" card becomes "Guardado" (income − spent).
- **Attention feed**: when nothing is pending it collapses to a single calm
  line instead of a full empty card.
- **Quick actions**: add-expense/add-income chips removed (the FAB owns
  capture; they also overlapped it on mobile). The personalized shortcuts +
  Import/Review remain, desktop-only — mobile relies on tab bar + FAB.
- **Desktop composition**: two-column grid (attention + recents left, donut
  right) so cards stop stretching across the full 1480px column.

## Validation

- `npm run build` clean (49 routes), TypeScript pass.
- Changes layered onto the concurrent onboarding/personalization work from the
  parallel session without reverting it (personalized CTAs preserved).
