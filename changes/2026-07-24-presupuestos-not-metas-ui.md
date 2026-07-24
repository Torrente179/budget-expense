# Presupuestos label; hide Metas in UI

## Summary

Product name for spending limits is **Presupuestos** (not “Límites de gasto”). Metas de aportación stay in the data model but are hidden from the Budget/Home UI for now.

## Product Changes

- Budget tab list titled **Presupuestos**; Metas card removed from the screen.
- Create/edit form always saves `kind: spending_limit` (no kind picker).
- Plan distribution and recommendation use spending limits only.
- Home already showed spending limits only.

## Data Model

No schema change. `contribution_goal` rows may still exist from method seeding/backfill but are not rendered.

## Validation

- Open `/budget`: one Presupuestos list, no Metas section.
- New budget saves as spending limit.
