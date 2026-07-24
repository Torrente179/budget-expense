# Home Presupuestos only; Metas on Budget tab

## Summary

Metas de aportación belong on `/budget`, not on the Home “Presupuestos” card. Fixed a snapshot bug that dropped `custom_budgets.kind`, which made every envelope look like a spending limit on Home (Ahorro / Inversión / Bendición appeared there).

## Product Changes

- **Home** Presupuestos carousel: only `spending_limit` envelopes.
- **Budget** tab: restored side-by-side **Presupuestos** + **Metas de aportación**.
- Create/edit form: kind picker again (Presupuesto vs Meta de aportación).
- Client fallback: if `kind` is missing, infer from linked category roles/classifications so Metas never leak onto Home.

## Data Model

- Migration `2026-07-24-month-snapshot-budget-kind.sql`: `prepare_month_snapshot` now includes `'kind', cb.kind` in each `customBudgets` object (applied live).

## Validation

- Hard refresh `/home`: Presupuestos should show ceilings only (e.g. Esenciales / Gastos de vida), not Ahorro / Inversión / Diezmo.
- Open `/budget`: Metas section lists contribution goals; Presupuestos lists spending limits.
- Create a Meta from the form → appears under Metas, not on Home.
