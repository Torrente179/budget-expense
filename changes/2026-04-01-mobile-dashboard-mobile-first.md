# 2026-04-01 — Mobile dashboard information hierarchy refresh

## Summary
- Reworked the dashboard mobile experience so critical month information is visible immediately without stacked, cramped cards.
- Added a dedicated mobile-only dashboard surface with a primary balance card, compact key metrics, quick actions, budget pacing signal, and a compact spending curve.
- Kept desktop dashboard composition intact while improving mobile scan speed and decision clarity.

## Product Changes
- Added `src/components/dashboard/mobile-dashboard-overview.tsx` to present:
  - current available amount as the main hero metric
  - compact spent/budget/envelope chips
  - direct quick actions for Expenses, Budgets, Investments, and Wisdom
  - budget pace badge and progress line
  - compact analytics chart with weekly delta and top category snapshot
- Updated `src/app/(app)/dashboard/page.tsx` to:
  - render the new mobile overview on small screens
  - keep existing summary cards and analytics grid on `md+`
  - use mobile-specific loading skeleton sizes
  - reduce recent activity density on dashboard mobile
- Updated `src/components/dashboard/recent-expenses.tsx` to support configurable list density via `maxItems`.

## Follow-up Polish
- Refined the three mobile metric boxes (`Spent`, `Budget`, `Envelopes`) so they read as framed data tiles instead of cramped chips:
  - stronger border contrast and subtle depth shadow
  - consistent tile height and vertical alignment
  - tighter label tracking and clearer amount typography

## Verification
- `npm run lint` passes.
- `npm run build` passes.
