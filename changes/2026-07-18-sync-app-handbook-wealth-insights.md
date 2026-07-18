# Sync app handbook with Wealth/Insights rework and favicon

## Summary

`docs/APP.md` (the living product handbook) was written before the premium
sweep (`changes/2026-07-18-premium-sweep-wealth-insights.md`) and the new app
icon (`changes/2026-07-18-new-budget-expense-favicon.md`) landed, so it no
longer matched the app. Brought it current — no code changes.

## Product Changes

None — documentation only.

## Data Model

None.

## Validation

- Audited every commit on `main` against `changes/` for a matching note —
  full coverage, no gaps.
- Updated `docs/APP.md`:
  - §4 Navigation & chrome rules: underline tabs are now the app-wide
    standard (Wisdom, Import review joined Wealth/Movements); `ui/tabs` has
    zero consumers. Added the `StatusTag` rule (replaces uppercase pills).
  - Inserted new §7 "Wealth (current composition)" and §8 "Insights (current
    composition)" describing the reworked overview/investments/insights
    screens, renumbering old §7–§10 to §9–§12.
  - §11 code map: added `status-tag.tsx`, `breakdown-donut.tsx`, Wealth, and
    Insights entries.
  - §12 change-note list: added the 4 notes missing from the cluster
    (signup fix, handbook itself, premium sweep, favicon).
- Verified only §2–§3 of `docs/APP.md` are cross-referenced by section number
  elsewhere (`README.md`, `design.md`, `docs/pending-migrations-runbook.md`,
  `docs/vercel-supabase-handoff.md`) — untouched by the renumbering, so no
  links broke.
- `design.md` itself was already current (both sessions had been keeping it
  in sync); no changes needed there.
