# 2026-10-02 — Review prompt on Home, Import as an action

## Summary
- Applied option C from the "Card Stream — Open Choices" canvas, picked by JP:
  Review is surfaced on Home when something is waiting, and Import becomes an
  action instead of a menu row.

## Product Changes
- Home shows a "N movements to review" card with a Review button whenever the
  review count is above zero. It names one waiting movement when the Home feed
  already holds it. Phone: under the Tracker pills. Desktop (from 1280px): top
  of the right rail. With nothing to review the card is not rendered.
- Desktop sidebar: the "More" group is now Wisdom and Settings. An
  "Import statement" button sits at the foot of the sidebar, above Log out.
  The Review row and its count badge are gone.
- Phone profile sheet: Review and Import rows removed; Wisdom and Settings stay.
- Movements, below 768px: an Import pill beside the month picker.
- The command menu still lists Review and Import.
- `src/lib/navigation.ts` now exports `MENU_NAV`, `REVIEW_NAV` and
  `IMPORT_NAV`; `SECONDARY_NAV` is the full list, used by the command menu.
- Home's loading skeleton now switches to two columns at the same 1280px
  breakpoint as the loaded view.

## Data Model
- None. The count comes from the existing app bootstrap (`reviewCount`).

## Validation
- `npx tsc --noEmit`: clean. `npm run lint`: 0 errors, 12 warnings (unchanged).
- `npx playwright test`: 17 passed, 3 skipped; visual baselines regenerated.
- `npm run build`: succeeds.
- Viewed on `/__design/up` at 375 and 1440 wide: card present on both, sidebar
  Import button present, no console errors.
- Not verified: the Import pill on the real Movements screen and the profile
  sheet, which are behind auth and not part of the fixture route.
- Known trade-off: with nothing waiting, Review is reachable only from the
  command menu; on desktop, pending reviews are signalled only on Home.
