# 2026-07-21 — Fix broken Add budget trigger on Budget tab

## Summary
The Budget screen’s edit sheet was always rendering the default “Agregar presupuesto” trigger. That control looked like a stretched full-width desktop button and could not open the sheet because open state is controlled by the edit row (`editBudget`). The stray trigger is gone; create actions use compact `w-fit` buttons.

## Product Changes
- Controlled edit `CustomBudgetForm` no longer shows an Add budget trigger.
- First-run “Crear” and objectives “Nuevo presupuesto” stay compact (`w-fit`) and open the create sheet.
- Default uncontrolled Add budget trigger also uses `w-fit` / `self-start` so it cannot stretch.

## Data Model
No Supabase changes.

## Validation
- Budget first-run: no full-width Agregar presupuesto under Generosidad; step 3 Crear opens create sheet.
- With objectives: Nuevo presupuesto opens create sheet; row tap still opens edit sheet without a ghost Add button.
