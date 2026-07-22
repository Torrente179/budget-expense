# 2026-07-22 — Loan Spanish labels, dates, income categories, people picker

## Summary

Localized loan movement labels (e.g. Spanish **Préstamo a Ana**), show/set loan dates in Wealth, add income categories (including Loan), store borrowers in `loan_people`, and let repayments be recorded from Income → Préstamo by picking a person/open loan.

## Product Changes

- Wealth → Préstamos: date field on create; lent date shown on each row; repayment date; Spanish expense/income text from locale.
- Capture expense Loan: borrower autocomplete from saved people; Spanish “Préstamo a …”.
- Capture income: category required (Salary, Other Income, Loan, …).
- Income → **Préstamo**: pick open loan/person → records income **and** reduces outstanding in Wealth.
- Wealth repayments also write income with Loan category and localized source (“Cobro de préstamo — …”).

## Data Model

- `categories.applies_to`: `expense | income | both` (Loan = both; Salary / Other Income = income).
- `income_entries.category_id` (nullable FK).
- `loan_people` (user_id + name, unique per user lowercased).
- Migration: `supabase/migrations/2026-07-22-income-categories-loan-people.sql` (applied).

## Validation

- Spanish locale: new loan expense description is “Préstamo a {name}”.
- Wealth loan row shows lent date; create form has date picker.
- Income capture shows Loan category; selecting it requires a person/open loan.
- Recording income Loan repayment updates Patrimonio → Préstamos outstanding.
