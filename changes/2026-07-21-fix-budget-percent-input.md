# 2026-07-21 — Fix invalid budget percentage input

## Summary
Percentage amounts on the create/edit budget sheet were rejected by the browser (e.g. entering `10`) because the field used `min="0.01"` with `step="1"`, which makes only values like 0.01, 1.01, 2.01… valid under HTML5 number rules.

## Product Changes
- Percentage mode now uses `min="1"` with `step="1"` so whole percents (1–100) validate correctly.
- Fixed amount mode still uses `min="0.01"` / `step="0.01"`.

## Data Model
No changes.

## Validation
- Enter `% of income` → `10` → form accepts and submits.
