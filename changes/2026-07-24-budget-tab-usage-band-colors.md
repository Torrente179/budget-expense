# Budget tab uses home usage-band colors

## Summary

Budget tab progress bars and status colors now follow the same five usage bands as the home budget rings (safe → critical via `src/lib/palette.ts`).

## Product Changes

- Overview bar and per-budget meters on `/budget` use usage-band hex colors (not month-pace green/amber/red).
- `ProgressMeter` defaults to usage bands; explicit `tone` still used for Giving.
- Legacy `CustomBudgetCard` / `BudgetCard` thresholds updated from 75/90% to the shared bands.

## Validation

- A ~95% budget shows Near limit orange on both home rings and the budget tab bar.
- ≥100% shows Exceeded red; ≥120% Critical.
- Giving meter still uses success/neutral tones.
