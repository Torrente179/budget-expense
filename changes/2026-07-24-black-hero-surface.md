# Black premium hero surface (Home + Budget)

## Summary

Swapped the blue month-summary heroes on Home and Budget for a premium black
card in the RappiCard vein: graphite→black gradient, hairline `white/10` edge,
a light catch along the top edge plus a soft corner bloom, white numbers
against muted `white/55` labels, and a single mint accent. All content, copy,
and layout are unchanged — this is chrome only.

Both heroes previously duplicated the same `HERO_GRADIENT` string; the new
chrome lives in one place instead.

## Product Changes

- **New** `src/components/patterns/hero-surface.tsx` — the shared hero chrome:
  - `HERO_SURFACE` — the card (gradient, radius, hairline ring, elevation).
    Dark mode raises the gradient a step so the card doesn't dissolve into the
    app's near-black page.
  - `HERO_TILE` / `HERO_ICON_TILE` / `HERO_RULE` / `HERO_TRACK` — the inner
    surfaces, so both heroes stay in lockstep instead of hand-rolling
    `white/xx` values.
  - `HERO_ACCENT` (`#34D399`, the palette's dark-mode income green) for income
    and healthy states.
  - `HeroSheen` — top-edge light catch + corner bloom.
- `src/components/home/home-summary-card.tsx` — uses the shared surface. Labels
  dropped from `white/80–95` to `white/55` for the black-card contrast ladder;
  income/spent chips are now `white/[0.08]` tiles rather than solid white
  circles; ring track `white/12`; pace tick ringed in `black/60` instead of
  blue; wallet watermark softened to `white/[0.05]`.
- `src/components/budget/budget-summary-hero.tsx` — same surface and tokens for
  the "al día" / pace-status tiles.
- The hero card is black in **both** themes; it is not a dark-mode-only look.

### Behavior change worth flagging

The Budget hero's progress bar clamps its width at 100%, so an over-plan month
used to render a *full green* bar directly under an "Over plan" label. The fill
now takes its color from the pace status: `#FB7185` when over plan, `#FBBF24`
at a high pace, mint otherwise. Revert to a fixed `HERO_ACCENT` fill if the
plain green is preferred.

## Data Model

No schema, query, or API change.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors, 13 warnings (unchanged baseline).
- `npm run build` — compiles, 52 static pages generated.
- Rendered both heroes through a temporary preview route (since removed):
  desktop Home hero with the usage ring, Budget hero on-track and over-plan,
  and the mobile Home layout — each checked in light and dark mode.
- Not exercised: the live screens behind auth (no working local session).
