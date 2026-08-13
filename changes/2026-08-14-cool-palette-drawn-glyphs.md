# Cool category palette + hand-drawn glyph family

## Summary

Two owner-chosen decisions, from options presented side by side on real feed
rows: the **"Cool"** category palette and the **fine-line** hand-drawn glyph
family. Both replace choices made in the preceding two changes.

## Product Changes

### Palette — "Cool"

`PALETTE_UP.categories` replaced. Blues, teals and violets with one warm accent
for food.

This fixes two defects introduced in
[`2026-08-13-up-design-pass.md`](2026-08-13-up-design-pass.md), both of which
made the feed harder to read rather than easier:

- **Six categories shared a hue with another.** Shopping, Subscriptions and
  Tithe were all `#B565D8`; Restaurants and Entertainment both `#FFE14D`;
  Travel and Transportation both `#28C4D8`; Groceries and Loan both `#3DDC97`.
  On a feed those pairs were indistinguishable.
- **Several tiles were too light to carry a white glyph.** The yellows
  (`#FFE14D`) left the icon almost invisible.

Every hue in the new set is distinct and dark enough for a white glyph. A
comment in `palette.ts` records both properties so a later edit does not
silently break them.

### Glyphs — hand-drawn "fine line" family

New module
[`src/components/shared/category-glyphs.ts`](../src/components/shared/category-glyphs.ts):
fourteen categories drawn on a 24×24 box as an outline plus an optional detail
path, stroked at 1.5 with round caps and joins.

`CategoryGlyph` now prefers a drawn glyph and falls back to lucide for anything
not in the set — rendered at the **same 1.5 stroke**, so the two families sit
together without a visible weight change. Legacy icon keys map to the drawn
glyphs, and a second lookup resolves by category name in English or Spanish, so
no stored row needs migrating.

Covered: Food & Dining, Groceries, Housing, Utilities, Transportation,
Entertainment, Subscriptions, Shopping, Healthcare, Travel, Education, Tithe,
Loan, Other. Everything else (Gym, Salary, Taxes, Insurance, Pets…) stays on
lucide.

## Data Model

None.

## Validation

- `npx tsc --noEmit` clean; `npx eslint src` 0 errors; `npm run build` compiles,
  56/56 static pages.
- Rendered all fourteen drawn glyphs plus two lucide fallbacks through the real
  `TransactionRow` with the live `PALETTE`, and confirmed the fallback weight
  matches the drawn family.

## Known gaps

- **The drawn family is mine, not a professional icon set.** It was chosen over
  lucide by the owner from four families shown side by side, but the weights are
  less even than a commercial set. The clapperboard in particular reads a little
  like a folder at 18px.
- **A solid/filled family was offered and is not viable as drawn.** Several
  glyphs are open strokes (a cart handle, a fork's tines) which cannot be
  meaningfully filled; a solid set needs every icon redrawn as a closed
  silhouette.
- Categories outside the fourteen remain on lucide, so the app runs two icon
  families. Matched stroke weight keeps that from showing, but it is a seam.
