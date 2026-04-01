# 2026-04-01 — Luxe ledger UI refresh

## Summary
- Reworked the app into a darker, near-black fintech visual system inspired by premium banking dashboards.
- Replaced the previous blue/editorial styling with neutral graphite surfaces, white primary actions, and restrained emerald data accents.
- Simplified the shell, dashboard, budgets, expenses, and wisdom surfaces so the interface feels flatter, sharper, and more product-led.

## Visual Direction
- Updated global design tokens in `src/app/globals.css` for a dark-first palette, cleaner contrast, and more neutral depth.
- Moved shell typography away from the earlier editorial feel by using a crisper sans-led heading treatment across navigation and page headers.
- Rebuilt button, badge, card, input, select, and picker styling around charcoal surfaces instead of tinted brand panels.

## Product Surface Changes
- Refined sidebar, topbar, mobile navigation, and page headers to match a luxury fintech shell.
- Restyled dashboard summary cards, chart framing, category breakdown, recent expenses, and the wisdom panel into a calmer ledger-like composition.
- Tightened the budgets experience so the protected pool and envelope surfaces read more like account summaries than content cards.
- Simplified expense filters, expense rows, and both composer sheets so the expense flow feels more fluid and less blocky.

## Verification
- `npm run lint` passes.
- `npm run build` passes.
