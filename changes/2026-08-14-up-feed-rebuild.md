# Up rebuild — Home and the ledger as a feed

## Summary

First screens of the **structural** rebuild, as opposed to the material pass in
[`2026-08-13-up-design-pass.md`](2026-08-13-up-design-pass.md). That pass
repainted the app; this one changes what is on the screen.

Context worth recording: after the design pass shipped, the owner's assessment
was that the live app was "nothing like the mockups" and amounted to a
recolour. That was correct. The design pass went through the token layer, which
cascades to every screen cheaply but cannot change any screen's anatomy — so
every screen kept the shape it had under Hybrid v1. The mockups in
[`mockups/up-true/`](../mockups/up-true/) are about anatomy, not paint.

This note covers 2 screens. **6 remain**: Budget, Wealth, Insights,
Recurrentes, Review/Import/Wisdom/Settings.

## Product Changes

**`MerchantMark` (new)** —
[`src/components/patterns/merchant-mark.tsx`](../src/components/patterns/merchant-mark.tsx).
The square that opens a feed row. Up leads with merchant identity rather than a
category glyph, because that is what you scan a statement for. We have no logo
assets, so this is the merchant's initial on a tile tinted by its category
colour: the letter carries identity, the colour keeps the category signal
`CategoryBadge` used to carry alone. Uncategorised rows fall back to a stable
hash of the title so they differ from each other instead of forming a column of
grey squares.

**`TransactionRow`** takes Up's shape — mark, name, small grey subtitle, amount.
**Outflows now carry no sign.** A feed is outflows by default, so the minus was
noise; the `+` on inflows is what should stand out. Rows are denser
(`min-h-16` → `min-h-[3.25rem]`).

**Feed striping is explicit.** Day separators must not consume a stripe step, or
the rhythm resets at every date boundary — which is exactly what `:nth-child`
does. Parity is computed across the whole feed and passed down, in both
`VirtualizedLedger` and Home.

**Home leads with the feed.** It was a hero plus three cards in a grid, with
recent movements demoted to the bottom of the left column and no date grouping
at all (the date was appended to each row's subtitle). It is now the coral
figure on ink → a full-bleed white sheet carrying a dated feed → `See all
movements`. Presupuestos and the donut follow below on mobile, and take the
right column on desktop.

**Movements** inherited the same feed: the ledger already grouped by day, so it
picked up the separators, marks and striping from the shared row.

New utilities in `globals.css`: `up-sheet` (the white content layer) and
`up-minibar` (the stacked-bar peek in the Insights row).

## Data Model

None. No schema, query or API change.

## Validation

- `npx tsc --noEmit` clean; `npx eslint src` 0 errors (14 pre-existing warnings);
  `npm run build` compiles, 56/56 static pages.
- Verified at 375×812 and 1280×820 against a temporary preview route rendering
  the **real** `TransactionRow` and `MerchantMark` — not hand-written markup,
  which is how the previous pass fooled itself. That caught two defects: outflows
  rendering with a minus sign, and the Insights minibar collapsing to zero height
  because its segments had no `height: 100%`.

## Known gaps

- **Home's composition is still unverified with real data.** Every screen is
  behind auth; the preview used dummy rows. The owner can see it signed-in on
  `localhost:3000` or the `up-app-rebuild` Vercel preview.
- **Presupuestos and the donut were kept on Home.** Up's Activity screen has
  neither — they would live only on Budget and Insights. Moving them is an IA
  decision, so they were demoted below the feed rather than removed.
- The remaining 6 screens still have only the material pass applied.
