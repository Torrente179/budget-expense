## Summary

Expense and spent amounts now use the palette money red (`text-negative` → `--danger`) across the app, so outflows read as red consistently next to green income.

## Product Changes

- Ledger rows (`TransactionRow`) render expenses in negative red; income stays positive green.
- Home Spent total, spend donut, objective spent figures, and giving amounts use `text-negative`.
- Movements month expense total, recurring charges, budget/insights spent figures, calendar day outs, category totals, capture/import/review expense amounts follow the same token.
- `CurrencyDisplay` and `BreakdownDonut` accept an optional tone so callers can opt into semantic money color without ad-hoc classes.

## Validation

- Spot-check Home, Movements, Budget, Insights (categories / calendar / report / giving), Capture sheet (expense vs income), Import review, and Review flow.
- Confirm income and non-expense wealth balances are unchanged (still green / neutral).
- Light and dark: red should track `--danger` / `--negative`.
