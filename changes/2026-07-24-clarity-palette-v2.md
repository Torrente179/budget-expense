# Clarity palette v2

## Summary

Introduces a switchable color palette for budget usage bands, cashflow stats (income / available / expense), and default category colors. Flip `ACTIVE_PALETTE` in `src/lib/palette.ts` (and mirrored CSS cashflow tokens) to restore OG colors.

## Product Changes

- Budget rings use 5 usage bands by spent÷limit (not month pace):
  - 0–69% Safe `#22C55E`
  - 70–84% Watch `#F59E0B`
  - 85–99% Near limit `#F97316`
  - 100–119% Exceeded `#EF4444`
  - 120%+ Critical `#BE123C`
- Home Ingresos → `#059669`; Disponible → `#2563EB`; Gastado → `#E11D48`.
- Default / known category colors updated to the clarity map (Housing indigo, Tithe turquoise, Restaurants coral, etc.).
- Month-progress mark on rings is unchanged.

## Data Model

- Migration `2026-07-24-palette-v2-category-colors.sql` updates existing category rows by known EN/ES names.

## Validation

- Gustos ~95% ring renders Near limit orange (`#F97316`).
- Income / Available / Spent home stats use the new cashflow colors.
- Set `ACTIVE_PALETTE = "og"` and restore OG `--income` / `--available` / `--expense` in `globals.css` to verify revert path.
