# Remove duplicate Insights category chart

## Summary

Removed the standalone “A dónde fue / Gasto por categoría” card from the Insights tab. The same category breakdown already lives inside **Análisis de gastos** (`MonthlyReport`), so the second list was redundant scroll noise.

## Product Changes

- Insights no longer shows a separate category spending bar list after the trend charts.
- Category spend breakdown and drill-down remain available via **Análisis de gastos**.

## Validation

- Open Insights for a month with expenses.
- Confirm category bars appear once, inside the monthly report card.
- Confirm category clicks from that report still open the category detail route.
