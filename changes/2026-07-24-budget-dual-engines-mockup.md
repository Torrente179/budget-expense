# Budget dual engines + Presupuesto mockup

## Summary

Implemented the Presupuesto tab mockup and dual-engine logic: **spending limits** (ceilings) vs **contribution goals** (floors), with separate status colors. Home keeps the earlier hero; its Presupuestos list shows spending limits only.

## Product Changes

- Budget tab: blue summary hero (“Disponible para el resto del mes”), Límites de gasto, Metas de aportación, Distribución del plan, Recomendación when a limit is exceeded.
- Create/edit form asks Límite de gasto vs Meta de aportación.
- Method seeding tags tithe/giving/savings/investing slices as contribution goals.
- Home Presupuestos carousel filters to spending limits only.

## Data Model

- `custom_budgets.kind` ∈ `spending_limit` | `contribution_goal` (default `spending_limit`).
- Backfill: envelopes whose categories are all giving/savings/investment → `contribution_goal`.
- `copy_custom_budgets_from_previous_month` and `replace_custom_budget_set` copy/seed `kind`.
- Migration: `supabase/migrations/2026-07-24-custom-budget-kinds.sql` (applied on live project).

## Validation

- `npx tsc --noEmit` passes.
- Live migration applied via `scripts/apply-sql.mjs`.
- Manual: open `/budget` — hero + two lists + distribution; create one limit and one goal; confirm Home only lists limits; over-limit shows recommendation.
