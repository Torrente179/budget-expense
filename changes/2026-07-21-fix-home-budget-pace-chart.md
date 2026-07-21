# 2026-07-21 — Fix home budget pace chart size and accuracy

## Summary
Home monthly-budgets chart was huge on mobile and showed **0% / Under pace** while spend existed against a **€0** limit (percentage budgets with no resolvable income, and zero-limit ratios treated as 0% instead of over).

## Product Changes
- Compact layout: small ring (~88px) beside the list instead of a stacked 152px hero.
- Percentage budgets fall back to recorded month income when the plan income is missing/zero.
- Spend with a €0 limit shows as over budget (full bar, danger tone, ∞%) instead of 0%.
- Same ratio/income fallback on the Budget tab.

## Data Model
No schema changes. Helper `budgetUsageRatio` in `src/lib/budgeting.ts`.

## Validation
- Gustos with spend and a % budget + income → non-zero limit and matching %.
- Zero limit + spend → danger / over, not green 0%.
- Home budgets card fits roughly one phone viewport strip, not half the screen.
