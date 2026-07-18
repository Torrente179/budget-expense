# Fix Generosidad to be income-based

## Summary

Generosidad / Giving was showing expense-linked totals and used recorded
income movements for the target. It now leads with a share of monthly plan
income (from onboarding), and the Generosidad budget only attaches to giving
categories (creating Diezmo/Tithe when missing).

## Product Changes

- Home + Budget Generosidad cards show the **income target** as the main figure
- Target prefers onboarding plan income, then recorded income
- Detail line shows how much has been given toward that target
- Onboarding with “give generously” sets `tithe_target_percent` to 10%
- Seeds a Tithe/Diezmo category if none exists so Generosidad never binds to
  essentials/lifestyle spend

## Data Model

None (uses existing `tithe_target_percent` and category `classification`).

## Validation

- Complete onboarding with income + give generously → Generosidad = 10% of that income
- Add regular expenses → Generosidad target unchanged; “given” stays 0 until a
  Diezmo/Giving expense is logged
- Budget → Generosidad card matches the same income-based target
