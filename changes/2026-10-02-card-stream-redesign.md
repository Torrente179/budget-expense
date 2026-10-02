# 2026-10-02 — Card Stream redesign (phone and desktop)

## Summary
- Replaced the Up-derived look with "Card Stream", the direction JP picked on
  2026-10-02 from the design canvas (board "2 + 3 · Card Stream"). It combines
  the balance card from the Card mock with the day-grouped feed from the
  Stream mock.
- Rebuilt Home and Budget for phone and desktop. The remaining screens take the
  new theme, header, navigation and rows, but their layouts were not recomposed.
- Fixed a class-merging bug in `cn()` that silently dropped the custom type
  scale (`text-body`, `text-caption`, …) whenever a text colour followed it in
  the same call.

## Product Changes

### Theme
- One dark appearance. The whole palette lives in the `:root` block of
  `src/app/globals.css` (ground `#0d0b0a`, card `#171311`, raised `#231c19`,
  text `#fbf3ec`, coral accent `#ff7a64`, income `#6fe3b0`, over-limit
  `#ff6a5c`). Changing the accent means editing that one block.
- Typeface is Manrope, loaded through `next/font`.
- New type tokens: `text-screen`, `text-detail`, `text-nav`.
- New utilities: `balance-card`, `wallet-card`, `stream-figure`. `up-stripe`
  is now a no-op.

### Shell
- The floating add button is gone. `CaptureProvider` sits in the app layout and
  a `CaptureButton` is the last item in every `Screen` header.
- `Screen` header is a single dark, blurred bar: back, title, actions, search,
  language and currency (from `lg`), profile (below `lg`), add.
- Phone tab bar is a floating capsule with the active item in coral.
- Desktop sidebar is rebuilt (`SidebarView` + `Sidebar` container): page-ground
  rail, pill rows, coral active icon, a "More" group for Review, Import, Wisdom
  and Settings.
- The month switch is `MonthTitle`, a popover around the existing `MonthPicker`.

### Home
- `HomeBalanceCard`: coral card with the available balance set by
  `MoneyFigure` (large integer, small currency sign and cents), the daily
  allowance and the pace status.
- Phone: In/Out line, scrolling tracker pills, then the feed.
- Desktop (from 1280px wide; narrower windows keep the single-column layout
  next to the sidebar): balance card beside a "This month" panel (In, Out, Left in plan,
  pace bar); below it the feed beside a rail with the tracker list and the
  spending breakdown.
- Feed: an Upcoming group for scheduled charges, then one group per day with
  that day's out/in totals. Rows use round monogram discs; rows that need
  review carry a coral "Review" chip.

### Budget
- Trackers render as `TrackerWallet`: stacked colour cards, one open at a time,
  showing spent-of-limit, a bar, the reset countdown, Edit and Delete.
- `BudgetSummaryFigure` leads the screen with what is left (or over) across
  trackers.
- From 1280px wide it is two columns: tabs, figure and wallet on the left; a sticky Plan
  column on the right (methods, copy last month, income, distribution,
  recommendation).

### Other screens
- Movements, Net worth, Insights, Review, Import, Wisdom, Settings, onboarding
  and auth use the new tokens, header, navigation, buttons, sheets and rows.
  Their summary bands become cards from `md` up. Their layouts are unchanged.
- Landing page demos use the production Home and Budget components.

### Removed
- `capture/capture-fab.tsx`, `home/home-summary-card.tsx`,
  `home/budget-pace-chart.tsx`.

### Unchanged on purpose
- Voice: remaining-first wording (`€124 left`, `€38 over`), no bare percentage
  as a budget headline, outflows in plain text, red only for an over-limit
  tracker, EN/ES through `t(en, es)`.

## Data Model
- None. No schema, migration, policy or query changes.

## Validation
- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors, 12 warnings (the same 12 as before this change).
- Unit: `test:balance` 8/8, `test:home` 4/4, `test:wealth` 22/22.
- `npx playwright test`: 17 passed, 3 skipped (the skips are the existing
  motion-timing cases), across compact-phone, reference-phone, tablet and
  desktop, including the axe run. Visual baselines regenerated.
- `npm run build`: succeeds.
- Viewed in the browser through the fixture route `/__design/up` at 375,
  1024, 1280 and 1440 wide, in the populated, empty, overspent, large-number, negative and
  long-Spanish states, plus `/` and `/login`.
- Not verified: the signed-in app with real data. Every app route is behind
  auth, so the real screens were only exercised through the fixture route.
- Known issue left as found: the auth story headline is lemon text on coral
  and is low contrast.
- Dev note: after adding type tokens the Turbopack dev cache served a
  stylesheet without them until `.next/dev` was deleted and the server
  restarted.
