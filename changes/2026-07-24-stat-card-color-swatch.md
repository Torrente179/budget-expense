# Stat card color swatch

## Summary

Home cashflow StatCards show a small colored dot beside the label that matches the value color (income / expense / available).

## Product Changes

- `StatCard` accepts optional `swatchClassName`.
- Income, Spent, and Available on home use swatches tied to their amount tone.

## Validation

- INGRESOS shows emerald swatch matching the amount.
- GASTADO shows raspberry swatch.
- DISPONIBLE shows cyan swatch (or expense red when balance is negative).
