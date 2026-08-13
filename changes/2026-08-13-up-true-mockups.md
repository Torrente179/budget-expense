# Up-faithful mockups, slice 1

## Summary

Added `mockups/up-true/` — six phone mockups built against JP's captures of the
real Up app, replacing guesswork with a measured reference.

The existing `mockups/up-redesign/` set turned out not to resemble Up at all: a
warm-cream canvas (`#fff3e8`), pure orange (`#ff4700`), rounded Nunito, hard
zero-blur "stamp" shadows, ceramic bowls with sloshing liquid, and an invented
vocabulary ("pools", "puddles", "stamps", "parked lines"). Up is dark chrome
under a white sheet, coral (`~#FF7A64`), tight geometric type and flat surfaces.
That set is left untouched for comparison — `mockups/` is untracked, so nothing
was overwritten.

Design direction is JP's: Up's identity wholesale on the visual side, Up's
*structure* but the app's own words on the copy side (remaining-first phrasing,
the app's domain terms kept).

## Product Changes

Six screens, chosen so that between them they exercise every pattern read off
the captures exactly once:

| Screen | Proves |
|---|---|
| `home.html` | Tab rail with clipped neighbours · coral hero + sync glyph · FX pill · white sheet · Upcoming drawer · date separators · merchant rows · round-up glyph · `6 Txns ⌄` · `4 of 16` |
| `budget.html` | Metas — dark canvas, white cards, edge-hugging coral bars, round-up badge, coral FAB |
| `meta-japan.html` | Meta detail — volumetric particle pool, `27%` chip, setting rows on chrome, coral action bar |
| `presupuestos.html` | Presupuestos — dark accent cards, line-art icons, remaining-first (`€124 left` / `€38 over`), overspend bar running into red |
| `home-forward.html` | Bottom sheet — grabber, background dims **and** desaturates, the acted-on row pinned to the top, pressed row state |
| `recurring.html` | Recurrentes — day-of-month rail, `~` FX-estimated amounts, teal month subtotal |

Domain mapping (Up's structure, the app's words): Spendable → **Available** ·
Savers → **Metas** · Trackers → **Presupuestos** · Regulars → **Recurrentes** ·
Round Ups → **Redondeos**.

Two structural findings from the captures that the earlier mockups had wrong:

- Up is **not** uniformly dark. Activity, Regulars and a Meta's activity list
  ride on a white sheet over dark chrome; Metas and Presupuestos are dark all
  the way down with cards floating on the chrome colour.
- Navigation is a **top tab rail**, not a bottom bar — active tab centred, its
  neighbours clipped by the screen edges. Up's own design blog confirms they
  rejected tab bars for swipe-anywhere navigation.

## Data Model

None. Static HTML/CSS/JS only. Nothing in `src/` was touched.

## Validation

- `python3 build.py` in `mockups/up-true/` regenerates all seven HTML files.
  `up.css` and `up.js` are hand-owned and never written by the build.
- Served on port 8781 via the `mockups-up-true` entry added to
  `.claude/launch.json`; all six screens rendered at 390×844 and compared
  against the captures.
- No console errors. No horizontal overflow (`scrollWidth === innerWidth`).
- `prefers-reduced-motion` kill switch verified present and collapsing all
  animation.

## Known gaps

- **Typeface is a stand-in.** Up's real face is unconfirmed — Brandfetch returns
  403 and their design blog never names it. Inter with tight numerals stands in;
  swap the single `--sans` line in `up.css` when identified.
- **Every duration and easing curve is invented.** The captures show *that*
  sheets slide and particles settle, not how fast. Both animations are commented
  `INVENTED` in `up.css`. Screen recordings would close this.
- Colour values are measured off screenshots, not an official brand sheet.
- Desktop is not attempted — Up is phone-only, so a desktop derivation would be
  extrapolation and is deferred until the phone look is signed off.
