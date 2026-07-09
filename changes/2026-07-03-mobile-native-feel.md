# 2026-07-03 — Mobile native feel: swipe, pull-to-refresh, safe-to-spend hero (Phase 4)

## Summary
- Movements gain swipe-to-delete with a 5-second Undo (optimistic hide, commit after the window), pull-to-refresh on touch devices, and the mobile dashboard opens with a **Safe to spend** hero — the stricter of cash available and remaining monthly budget, with a one-line why. Online-only by design (no service worker).

## Product Changes
- **Swipe-to-delete** on movement rows (mobile only): swipe left reveals delete; the row hides instantly and a toast offers Undo; the actual DELETE fires after 5s. Desktop keeps the hover trash button + confirm dialog. Tap-to-edit unchanged.
- **Pull-to-refresh** on the movements list (touch-only, resistance curve, spinner past ~70px) invalidating expenses + incomes.
- **Safe to spend hero** on the mobile dashboard: `min(income − spent − transfers, budget − spent)`; shows "Budget cap" when the plan is the binding constraint; emerald/rose by sign.
- Touch polish: `overscroll-behavior-y: contain` on the app scroll container and a subtle `scale(0.98)` press response, both scoped to coarse pointers.

## Data Model
- None.

## Code Changes
- New: `src/components/shared/swipeable-row.tsx` (framer-motion `drag="x"`, `dragDirectionLock` + `touch-action: pan-y` so vertical scroll is never hijacked; no new dependency), `src/components/shared/pull-to-refresh.tsx`, `src/components/dashboard/safe-to-spend-hero.tsx`.
- Modified: `movimientos-page.tsx` (SwipeableRow + PullToRefresh + optimistic pending-delete set with undo timers), `dashboard/page.tsx` (hero above the mobile overview), `globals.css` (coarse-pointer block).

## Validation
- `npx tsc --noEmit` clean; `npm run build` succeeds; lint errors **reduced** from 5 to 3 (the movimientos restructure resolved two pre-existing issues; the remaining 3 are pre-existing in `calendar/page.tsx`, which has unrelated uncommitted changes).
- Real-device pass (iOS Safari / Android Chrome: swipe vs scroll axis lock, undo restoring aggregates, hero numbers vs budgets page) pending DB/env restoration — see `docs/pending-migrations-runbook.md`.
