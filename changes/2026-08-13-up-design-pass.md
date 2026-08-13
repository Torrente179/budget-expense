# Up design pass — applied to the app

## Summary

Replaced Hybrid v1 with the Up system in `src/`, on branch `up-design-pass`.
Direction and reference are JP's, chosen from captures of the real Up app; the
design language is extracted in
[`changes/2026-08-13-up-true-mockups.md`](2026-08-13-up-true-mockups.md) and the
approved mockups are in [`mockups/up-true/`](../mockups/up-true/).

Four decisions taken by JP before starting:

| Question | Answer |
|---|---|
| Fidelity | Up's identity wholesale (visual) |
| Voice | Up's structure, the app's own words — remaining-first phrasing, domain terms kept, EN/ES preserved |
| Theme | **One appearance.** Up has no light/dark, so the toggle is gone |
| Desktop | Keep the sidebar and the wide layouts; apply Up's materials to them |

One judgment call made without asking, because the alternative was unsafe:
**`--foreground` stays ink and the page ground stays light.** Making the whole
page dark would have inverted `text-foreground` in ~100 files and produced
white-on-white inside every `Card`. Instead the dark layer is applied per
surface (`up-chrome`, `up-canvas`, `HERO_SURFACE`, the sidebar) — which is what
Up actually does: Activity and Regulars ride on a white sheet over dark chrome.

## Product Changes

**Navigation (the largest change).** The mobile bottom tab bar is gone —
`tab-bar.tsx` deleted, replaced by
[`nav-rail.tsx`](../src/components/layout/nav-rail.tsx): a horizontally
scrolling rail pinned to the top on the ink band, active section centred with
its neighbours clipped by the screen edges. Up rejected tab bars for exactly
this. `RAIL_NAV` was added to `lib/navigation.ts` — the same items in rail order
(Net worth · Insights · **Home** · Movements · Budget), because with Home first
in `PRIMARY_NAV` nothing ever sits to its left and the clipping affordance only
works on one side. The sidebar and command menu keep `PRIMARY_NAV` order.

**Remaining-first budgets.** Presupuesto cards became Up Trackers: dark card,
category-accent glyph, `€124 left` / `€38 over`, and a thin accent bar
full-bleed to the card's bottom corners that turns red past the limit. The
usage ring, the `%` numeral and the month-pace mark on the ring are **removed** —
Up never shows a bare percentage. `CircularMeter` and `formatUsagePercent` were
deleted with them.

**One appearance.** `next-themes` provider deleted; toggles removed from the
topbar, the mobile profile sheet and Settings' Appearance card. The `dark`
variant is still declared so existing `dark:` utilities compile, but nothing
sets the class.

**Materials.** `chrome-figure` (the machined gradient headline) → `up-figure`, a
flat coral numeral. `groove-dark`/`groove-light`/`groove-fill` → `up-track` /
`up-track-dark`, flat painted bars. `HeroSheen` deleted from all five heroes.
`HERO_SURFACE` is flat ink, full-bleed and square on mobile so it continues the
rail's band, rounded card on desktop. Cards lost their shadow; Buttons became
coral pills with no lift; the FAB uses a coral halo (`up-fab-glow`).

**Typeface.** Geist — which was still being downloaded on every page load but
overridden in CSS and rendered nowhere — replaced by **Inter**, loaded via
`next/font`. Inter is a labelled stand-in, not a chosen face (see Known gaps).

**Palette.** `PALETTE_UP` added and `ACTIVE_PALETTE` flipped to `"up"`. Earlier
palettes remain for a one-flip revert.

## Data Model

None. No schema, migration, query or API change.

## Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src` — 0 errors; the 14 warnings are pre-existing
  `react-hooks` findings in untouched files.
- `npm run build` — compiles, 56/56 static pages generated.
- **Visually verified** at 375×812 and 1280×860 via a temporary public preview
  route (since removed) that rendered the real `NavRail`, the real `Sidebar` and
  the real `HERO_*` tokens: rail clipping on both edges with the active item
  centred, coral hero on the ink band, remaining-first trackers with the
  overspend bar in red, white sheet reading against the chrome, dark sidebar
  legible. `/login` verified directly — coral pill, Inter, flat card.
- Two bugs were caught by looking rather than by the build: white-on-white Saver
  card text under the dark sheet, and a sidebar that set a dark background but
  never set a text colour, leaving ink-on-ink links invisible.

## Known gaps

- **Inter is a stand-in.** Up's real typeface is unconfirmed — Brandfetch
  returns 403, their design blog never names it. Swap the three `--font-*` lines
  in `globals.css` and the `next/font` import when identified.
- **Signed-in screens have not been seen in their real state.** Everything is
  behind auth; verification used a synthetic preview of the same components with
  dummy data. The same limitation shipped Hybrid v1 unverified. A throwaway
  account would close this.
- **A light seam remains between the header band and the Home hero.** `Screen`'s
  `mb-4` sits between them, and the hero is not a direct child of the header
  (there is a conditional setup card and a grid in between), so closing it means
  restructuring Home's layout — out of scope for a design pass and not
  verifiable blind.
- **The brand mark now conflicts with the palette.** Its emerald slash
  (`#18b986`) predates this pass and no longer belongs to a system where green
  means money arriving and coral carries the brand. Left untouched deliberately:
  the identity is the owner's call. Flagged in `design.md` §2.6.
- **`next-themes` is still in `package.json`** though nothing imports it.
  Left to avoid unrelated lockfile churn.
- Desktop is an extrapolation — Up is phone-only, so the sidebar treatment has
  no reference to check against.
