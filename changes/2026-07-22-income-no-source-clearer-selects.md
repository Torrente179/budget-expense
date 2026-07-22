# 2026-07-22 — Remove income Fuente; clearer select menus

## Summary

Removed the redundant **Fuente** field from income capture (source is derived from category or loan person). Select dropdowns use larger text, solid card background, stronger borders, and bigger tap targets for easier reading.

## Product Changes

- Income capture: no Fuente field; stored `source` = category label (or “Cobro de préstamo — {persona}”).
- Global Select: taller trigger, solid `bg-card` menu, `text-base` / `py-3` options, higher contrast highlight.

## Validation

- Add income with category only (no Fuente) succeeds.
- Open category/currency selects: menu is opaque and options are large/readable.
