# Fix capture multi-add, currency, and income

## Summary

Capture was closing and unmounting before saves finished, so later expenses
and income could fail silently. Selecting COP could also be wiped back to EUR
when the profile currency loaded. Fixed the save lifecycle, currency seeding,
and income optimistic updates.

## Product Changes

- Save completes before the sheet closes; errors keep the sheet open
- **Save & add another** keeps the sheet open for back-to-back entries
- Currency is seeded only when the sheet opens (not when base currency loads)
- Last-used currency is remembered for income as well as expenses
- Ledger rows show the original currency (e.g. COP) next to the converted amount
- Income adds update the list immediately (optimistic), like expenses

## Data Model

None.

## Validation

- Add expense in COP → row shows converted EUR **and** `(… COP)`
- Add several expenses with **Save & add another** → all persist
- Add income with source + COP → appears under Movements → Income
- Force a network failure mid-save → sheet stays open with values intact
