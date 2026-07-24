# Home Presupuesto cards: mockup grid layout

## Summary

Rebuilt the Home "Presupuestos" cards to the supplied Metas mockup: tiles sit
**side by side, three per row**, each with a tinted round category glyph on the
top left, the usage ring with its `%` inside on the top right, then the budget
name, the spent amount, and `de <limit>` / `of <limit>` underneath. Four or more
budgets keep paginating three at a time (snap scroll + dots), as before.

Previously the same data rendered as full-width horizontal rows stacked three
deep, which made the Home column tall and looked nothing like the mockup.

## Product Changes

- `src/components/home/budget-pace-chart.tsx`
  - `BudgetMetaCard` is now a vertical tile (glyph + ring on top, text below)
    instead of a horizontal row.
  - Each tile is its own `@container/budget-card`, so padding, glyph, ring and
    type scale off the tile's real width. Three tiles fit both the narrow Home
    column (~166px each) and a 375px phone (~97px each) without truncating
    amounts.
  - `CircularMeter` was rewritten in viewBox units (`100×100`, stroke `12`) so
    the ring scales with CSS width; the month-pace mark is now an SVG circle
    inside the ring instead of an absolutely positioned dot.
  - Pages render as a fixed 3-column grid, so card width never jumps between
    carousel pages; a lone budget is capped at `14rem`.
  - Scroller is flush horizontally (padding moved onto each page) so the next
    page no longer peeks a sliver of a card at rest.
  - New optional `icon` on `BudgetPaceItem`.
- `src/components/home/home-screen.tsx`
  - Passes `icon` per budget: the category carrying most of that budget's spend
    this month (falls back to `Target` when a budget has no categories).
  - Card action link reads "View all" / "Ver todos" instead of "Manage" /
    "Gestionar", matching the mockup's "Ver todas".
- `src/components/shared/category-badge.tsx`
  - New `CategoryGlyph` export: the bare category pictogram for callers that
    draw their own container. (`resolveCategoryIcon` was avoided — the
    react-compiler lint rule rejects components produced by a function call.)

Color semantics are unchanged: the ring and glyph tint follow spending-limit
usage bands (safe → critical), never Metas success green. The `%` label reads
`foreground` like the mockup, switching to the band color when the budget is
over its limit — as does the spent amount.

## Data Model

No schema, query, or API change. The leading-category glyph is derived from
`custom_budget_categories.categories.icon`, already present in the month
snapshot.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors, 13 warnings (same as the pre-change baseline).
- `npm run build` — succeeds.
- Rendered the component through a temporary preview route (since removed) and
  checked in the browser: 554px Home column, 343px phone, 1/2/3-budget rows,
  5-budget carousel (page 2 keeps card width, dots track the active page),
  over-limit tile (114% → red ring, red `%`, red spent), long name truncation,
  Spanish formatting (`263,00 €` / `de 273,32 €`), and dark mode.
- Not exercised: the live Home screen behind auth (no working local session);
  the carousel's smooth-scroll dot animation, which the preview browser
  disables globally (instant scrolling to the same offsets works).
