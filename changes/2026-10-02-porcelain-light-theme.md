# 2026-10-02 — Porcelain light theme with a Light / Dark / Match device switch

## Summary
- Added a second appearance, "Porcelain" (cool near-white ground, white cards),
  beside the dark Card Stream theme. JP picked Porcelain from the "Open
  Choices" canvas and asked for both themes with a switch.
- Dark stays the default until someone chooses otherwise.
- This lifts the previous "one appearance" rule; `design.md` is updated.

## Product Changes
- Settings has an Appearance card: Light, Dark, Match device. The phone profile
  sheet has an Appearance row that steps through the same three.
- The choice is stored in the `be_theme` cookie. The server renders it as
  `data-theme` on `<html>` and sets the browser theme colour to match, so the
  page paints in the right theme on first load with no flash and no script.
  "Match device" is resolved by the stylesheet with `prefers-color-scheme`.
- `src/app/globals.css`: the dark tokens now apply to `:root` and
  `[data-theme="dark"]`; a `theme-light` variant holds the Porcelain tokens.
  New tokens: `--coral-ink` (the accent as text or an icon; `text-coral` and
  `text-primary` resolve to it), `--nav` (tab bar), `--scrim` (sheet and dialog
  veil), `--tint-toward` (category tints), `--card-shadow`.
- In Porcelain the accent text is a burnt orange and the over-limit red is a
  cool crimson, so the two never read as the same colour. All Porcelain text
  colours were set from measured contrast against white, the ground and the
  tinted pills.
- App screens no longer hard-code white or ink colours: roughly 100 lines using
  `text-white`, `bg-white/…`, `border-white/…`, `bg-ink` and literal hex were
  moved to tokens across Movements, Recurring, Net worth, Insights, capture,
  loading skeletons, the month picker and the hero bands. The dark theme looks
  the same apart from text moving from pure white to the warm-white token.
- Not given a light version: the landing page, login/signup, onboarding, the
  error page and 404. They pin themselves dark with `data-theme="dark"`.
  The coloured tracker wallet cards and the balance card keep their own fills
  and text in both themes.
- Review harness (`/__design/up`): theme buttons in its header, and a
  `data-review-ready` marker set after hydration.

## Data Model
- None. The preference is a cookie, not a profile column, so it is per browser.

## Validation
- `npx tsc --noEmit`: clean. `npm run lint`: 0 errors, 12 warnings (unchanged).
- Unit: balance 8/8, home 4/4, wealth 22/22.
- `npx playwright test`: 25 passed, 3 skipped, run repeatedly without a flake.
  New: a light-appearance visual baseline and an axe run on all four viewports.
  Axe is clean in both themes.
- `npm run build`: succeeds.
- Viewed on `/__design/up` in both themes at 375 and 1440 wide; switching
  updates the page, the cookie and the theme colour, and survives a reload.
  `/` and `/login` stay dark under a Light preference.
- Test fix: the visual tests could capture before hydration finished, which
  made React report a mismatch (the screenshot styles inputs to hide the
  caret). They now wait for `data-review-ready`.
- Not verified: the Settings card and profile-sheet row on the signed-in app,
  and Porcelain on real data. Screens outside the fixture route (Settings,
  Import, Review, Wisdom, budget wizard, wealth editors) were swept for
  hard-coded colours but not viewed in light.
