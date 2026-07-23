# Fix debt type i18n and onboarding recurring setup

## Summary

Spanish users saw raw English enum values (`loan`) in the Wealth debt type selector and list. Onboarding also created recurring expenses without asking for category or making monthly cadence clear, and defaulted them onto day 1 of the current month (often already past).

## Product Changes

- Wealth liability type select and list rows show translated labels (e.g. Préstamo / Tarjeta de crédito).
- Onboarding debt types use the same full bilingual labels as Wealth.
- Onboarding fixed expenses now require description, amount, category, and monthly charge day.
- Copy clarifies that each fixed expense repeats every month.
- If the chosen charge day already passed this month, the recurring expense starts next month instead of creating a backdated current-month expense.

## Data Model

None.

## Validation

- `npx tsc --noEmit`
- `tsx --test src/lib/recurring-expenses.test.ts`
