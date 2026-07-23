# Insights daily spend chart

## Summary

Replaced the Insights cumulative spending area chart with a daily spending bar chart, and restyled both Insights trend charts with a softer magenta spend color instead of green / alarm red.

## Product Changes

- **Gasto diario**: bars show spend per day so high-spend days stand out; current month ends at today (no flat future tail).
- Past months still show the full month.
- **Gasto mensual, 12 meses** and **Gasto diario** both use `#EC4899` (clarity Health pink) — expense-adjacent, not success green and not harsh raspberry.

## Validation

- Open Insights on the current month: daily chart x-axis stops at today; tall bars match high-spend days.
- Open a past month: daily chart covers all days in that month.
- Both trend charts render in the same magenta; cashflow amount text remains `--expense`.
