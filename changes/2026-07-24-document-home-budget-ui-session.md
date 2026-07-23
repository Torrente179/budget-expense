# Document Home / Budget UI session (2026-07-23 → 07-24)

## Summary

English handbook sync for the production UI session that reshaped Home and
Budget: desktop two-column layouts, per-budget usage rings, clarity palette
(cashflow + five usage bands + category colors), stat swatches, and Budget
tab density (rings left / plan right; Primicias card removed later).

## Product Changes

Docs-only. Behavior described below is already shipped; this note keeps
`docs/APP.md`, `design.md`, Architecture, and the migrations runbook aligned.

### Home (`/home`)

1. **Desktop grid:** movements left (`lg:col-span-3`); monthly budgets +
   “Where it went” stacked right (`lg:col-span-2`).
2. **Per-budget rings** replace the aggregate ring + redundant bars.
   - Color = spent÷limit usage bands (not month-pace).
   - Fill clamps at 100%; % label can exceed 100%.
   - Size ladder 88 / 76 / 64 px; max 3 per swipe page; even `1fr` grid.
3. **Cashflow stats:** Income `#059669`, Spent `#E11D48`, Available `#06B6D4`
   (cyan after retune from blue), with matching label swatches.
4. Category-colored rings were considered and **rejected** (would hide usage).

### Clarity palette (`src/lib/palette.ts`)

| Band | Ratio | Hex |
|---|---|---|
| Safe | 0–69% | `#22C55E` |
| Watch | 70–84% | `#F59E0B` |
| Near limit | 85–99% | `#F97316` |
| Exceeded | 100–119% | `#EF4444` |
| Critical | 120%+ | `#BE123C` |

- Flip `ACTIVE_PALETTE` to `"og"` (+ mirror CSS cashflow tokens) to revert.
- Category defaults updated; live rows via
  `2026-07-24-palette-v2-category-colors.sql` (applied).
- **Housing** restored to yellow `#EAB308` after an indigo trial.

### Budget (`/budget`)

1. Usage bands shared with Home (`ProgressMeter` default + plan bar).
2. **Two-column desktop:** rings + manage list left; plan right (`max-w-xs`
   meters). Mobile: Plan → Budgets.
3. Rings support `onSelect` to open the edit sheet on this page.
4. Primicias / Generosidad card **removed** from Budget (see dedicated note);
   plan card exposes visible delete-income when a plan exists.

## Data Model

- Migration `supabase/migrations/2026-07-24-palette-v2-category-colors.sql`
  applied on `awpygbfocmynxpadpsji` (Housing `#EAB308`).

## Validation

- `docs/APP.md` §1, §8–§9, §14–§15, §17 match current Home/Budget UI.
- `design.md` §1–§2.1.1 and quick reference cover tokens, bands, rings, Budget layout.
- `Architecture/05` describes both Home and Budget desktop compositions.
- `Architecture/06` documents UI usage bands vs toast thresholds (75/90/100).
- Runbook lists the palette migration as applied.
