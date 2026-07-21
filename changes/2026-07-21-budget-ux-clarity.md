# 2026-07-21 — Budget UX: one clear model

## Summary
Budgets now follow one mental model: **plan = income**, **budgets = named category limits**, **method = shortcut that creates budgets**, **Generosidad = Primicias card**. Methods seed real `custom_budgets`; setup is two steps; Insights “Budget use” tracks custom budgets; copy last month also copies the plan when missing.

## Product Changes
- First-run: “Two steps” — set income, then **Use a method** or **Build myself** (no decorative method step).
- Applying a method creates percentage budgets from slices (categories by classification). Tithe/giving slices are skipped so Generosidad is not duplicated.
- Existing budgets: confirm before replace.
- Copy / Home: “objectives” → “budgets” / “presupuestos”.
- Unallocated spend line under the budget list.
- Insights Budget use reads custom budgets (legacy envelopes left unused on that surface).
- Copy last month also copies the monthly plan when this month has none.

## Data Model
No schema migration. Uses existing `custom_budgets`, `custom_budget_categories`, `monthly_budget_plans`.

## Validation
- Typecheck clean.
- Apply 50/30/20 with categories classified → Needs / Wants / Savings budgets appear; Generosidad unchanged.
- Insights shows those budgets under Budget use when legacy envelopes are empty.
