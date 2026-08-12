# Hybrid v1 design pass

## Summary

Applies the "Hybrid v1" visual direction to the app: the shipping design keeps its
structure, and three things change. The headline balance becomes polished metal, meters
become machined grooves, and category colour drops chroma toward steel. Category icon
chips lose their tint. The typeface moves from Geist to Helvetica Neue.

Structure is deliberately untouched: light-first page, the black hero card and its exact
`158deg` gradient, `rounded-xl` cards with `elevation-1`, usage rings, the donut, the
floating tab capsule, the capture FAB, and all copy and IA are unchanged.

This is a reversible aesthetic pass. `ACTIVE_PALETTE` flips back to `"v2"` in one line,
and the typeface is three lines in `globals.css`.

## Product Changes

- **Headline figure.** A new `chrome-figure` utility clips a vertical polish gradient to
  the glyphs, with a dark horizon at the optical centre. Applied to the headline figure on
  **all five screens that lead with one** (`HERO_SURFACE` consumers): Home (mobile and
  desktop), Budget, Patrimonio, Wealth category, Accounts.
- **Negative net worth is exempt.** `patrimonio-hero` colours its figure conditionally.
  `chrome-figure` sets `color: transparent`, which would have destroyed that signal, and a
  negative net worth should not be dressed up as polished metal. It keeps flat ink.
- **Meters.** Every hero bar and `ProgressMeter` are inset grooves rather than painted
  bars, via `groove-dark` / `groove-light` / `groove-fill`. Heights drop to `h-1`. The
  desktop month-progress tick is retained. On Budget and Wealth-category the **fill keeps
  its semantic colour** (usage band, `HERO_ACCENT`); only the track becomes a groove.
  `HERO_TRACK` now has no consumers outside its own definition.
- **Category chips.** `CategoryIcon` uses a neutral `bg-muted` chip with a `border-border`
  edge; the glyph keeps its category colour. The tinted-square background is gone.
  `CategoryBadge` (the pill form) is unchanged.
- **Typeface.** `--font-sans`, `--font-mono` and `--font-heading` all resolve to
  `"Helvetica Neue", Helvetica, Arial, sans-serif`.

## Data Model

None. No schema, migration, or query changes.

Note: `categories.color` is data-driven per row, so the new hues apply to **defaults and
seeds only**. Existing rows keep their stored hex until a migration updates them. The
donut and ledger marks on an existing account will still show the old full-chroma values.

## Design tokens

| Token | Before | After |
|---|---|---|
| `--font-sans` / `--font-mono` | Geist / Geist Mono | Helvetica Neue system stack |
| `ACTIVE_PALETTE` | `"v2"` | `"hybrid"` |
| `PALETTE.categories.housing` | `#EAB308` | `#C9A227` |
| `PALETTE.categories.shopping` | `#8B5CF6` | `#8B6FB0` |
| `PALETTE.categories.health` | `#EC4899` | `#C0784A` |

`cashflow`, `budgetUsage` and `wealth` are inherited from `PALETTE_V2` unchanged: those
carry meaning and must not move for aesthetic reasons.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (13 pre-existing warnings in providers, untouched).
- `npm run build` — succeeds, all routes compile.
- **Tabular figures verified in the browser.** The risk with dropping Geist Mono is digit
  jitter. Measured on the running app: `1111111111` and `0000000000` both render at
  **222.41px** in the resolved family, so `tabular-nums` holds and amounts stay aligned.

## Known gaps

- **Not visually verified while signed in.** Every treated screen is behind auth, so the
  chrome figures, grooves and neutral chips were verified by build, by grep coverage
  across all `HERO_SURFACE` consumers, and by unit measurement, not by looking.
- **Not covered by this pass:** the Home Presupuesto rings (`BudgetPaceChart` renders its
  own ring), `BreakdownDonut`, the liquid-glass tab bar, and the magenta Insights spend
  series. These keep the current design.
- **`chrome-figure` is dark-surface only.** On a light ground its bright stops fall to
  roughly 1.1:1 and the glyph dissolves. It is currently applied only inside the hero
  card. Do not reuse it on ordinary amounts.
- **Non-Apple platforms fall back to Arial.** Helvetica Neue is a licensed system font. A
  self-hosted fallback (Switzer or similar) would need to be added as a font asset if
  cross-platform parity matters.
- `design.md` still documents Geist and Geist Mono, and the mono-numeral rule in §2.2. It
  should be updated if this direction is kept.
