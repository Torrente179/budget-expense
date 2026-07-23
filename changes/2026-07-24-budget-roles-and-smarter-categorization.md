# Budget roles + smarter category suggest

## Summary

Added a per-category `budget_role` so budgeting methods can seed envelopes precisely, and improved title-based category suggestions with history ranking, merchant-pattern learning, and alternative chips in Capture.

## Product Changes

- Settings → category roles: stewardship **classification** + **budget role** (housing, tithe, loan_lent, savings, etc.).
- Applying a method uses `budget_role` (not coarse classification). Giving slices create envelopes; income and loans-lent stay out of spend envelopes.
- New default categories: Insurance, Cash, Savings, Investments.
- Capture suggest returns top 3 (rules + history). Picking a non-top category learns a short merchant pattern.
- Import “remember” also stores extracted merchant tokens.

## Data Model

- `categories.budget_role` NOT NULL with closed CHECK vocabulary.
- Migrations:
  - `2026-07-24-category-budget-roles.sql`
  - `2026-07-24-reclassify-insurance-cash.sql` (Generali/Mutua → Insurance; ATM → Cash)

## Validation

- Apply migrations on `awpygbfocmynxpadpsji`.
- Settings shows roles; Loan = Préstamos dados / `loan_lent`.
- Apply Base cero: Housing-only Vivienda; essentials without housing collision; Donations envelope; Savings envelope; no Loan in Ahorro.
- Capture “Generali” / known merchant → suggestions; correcting once improves next match.
