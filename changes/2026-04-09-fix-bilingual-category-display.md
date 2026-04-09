## Summary
- Fixed category labels so they follow the selected site language instead of staying in whichever language was stored.
- Normalized the legacy `Tithe / Diezmo` category so it displays as `Tithe` in English and `Diezmo` in Spanish.

## Product Changes
- Category rendering now translates in both directions, so categories stored in English, Spanish, or the mixed legacy tithe label resolve to the active locale.
- The monthly report card now uses localized category labels everywhere it displays category names.

## Data Model
- No schema or migration changes.

## Validation
- `npm run build`
- `npx eslint src/lib/constants.ts src/providers/locale-provider.tsx src/components/dashboard/monthly-report.tsx src/app/(app)/available-now/page.tsx src/app/(app)/analytics/page.tsx src/app/(app)/analytics/category/[id]/page.tsx src/app/(app)/dashboard/page.tsx` now only reports the pre-existing `react-hooks/set-state-in-effect` warning in `src/providers/locale-provider.tsx`.
