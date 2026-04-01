# 2026-04-01 — Mobile nav spacing and analytics chart polish

## Summary
- Improved bottom mobile navigation spacing so longer Spanish labels (e.g. `Presupuestos`) no longer distort tab distribution.
- Fixed mobile dashboard analytics rendering for low-data scenarios (start of month), where the chart could appear as a floating point instead of a readable curve.
- Polished movement count copy to use correct singular/plural wording in English and Spanish.

## Product Changes
- Updated `src/components/layout/mobile-nav.tsx`:
  - switched tab layout to equal-width items with `flex-1 basis-0`
  - tightened mobile icon/text sizing and horizontal padding
  - centered/truncated labels to avoid visual overflow and uneven spacing
- Updated `src/components/dashboard/mobile-dashboard-overview.tsx`:
  - added a resilient `chartSeries` fallback for single-point datasets
  - disabled chart dots (`dot={false}`, `activeDot={false}`) to remove isolated floating marker behavior
  - aligned line stroke color with chart palette token (`--chart-1`)
  - corrected movement count localization for singular/plural grammar

## Verification
- `npx eslint src/components/layout/mobile-nav.tsx`
- `npx eslint src/components/dashboard/mobile-dashboard-overview.tsx`
