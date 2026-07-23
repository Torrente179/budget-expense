# Remove protected budget %

## Summary

Removed the monthly plan’s “protected budget %” (`allocation_percent`) from the product surface. The plan now only captures expected monthly income; how money is split lives in budgets/methods.

## Product Changes

- Monthly plan sheet: income + currency only; no protected-% field or pool preview based on a %.
- Budget tab caption shows income only (no “X% to budgets”).
- Applying a budgeting method creates named budgets only; it no longer writes a plan allocation %.
- Method copy updated so users adjust percentages on budgets, not on the plan.
- Home / insights budget totals prefer the sum of custom budgets (then planned income, then legacy category budgets).

## Data Model

- Column `monthly_budget_plans.allocation_percent` remains (NOT NULL). Writes always persist `100` via `MONTHLY_PLAN_FULL_ALLOCATION` so existing rows and constraints stay valid without a migration.

## Validation

- Typecheck/lint touched files mentally aligned; form schema no longer requires `allocation_percent`.
- Existing plans keep working; new saves normalize allocation to 100 under the hood.
