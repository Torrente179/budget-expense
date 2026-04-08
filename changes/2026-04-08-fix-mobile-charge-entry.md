# 2026-04-08 — Fix mobile charge entry

## Summary
- Fixed mobile expense and recurring-charge entry so decimal amounts from locale-specific keyboards are parsed correctly before validation and submission.
- Updated the related amount fields to use a decimal-friendly input mode instead of relying on browser `number` parsing.

## Product Changes
- `ExpenseForm`, `RecurringExpenseForm`, and `IncomeForm` now normalize amount input before React Hook Form validation.
- Amount inputs now accept decimal keypad input more reliably on mobile devices, including locales that use commas as decimal separators.

## Data Model
- No data model changes.

## Validation
- `npm run build`
- `npm run lint` currently fails because of pre-existing unrelated ESLint errors in analytics, calendar, dashboard, and other untouched files.
