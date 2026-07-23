# Insights chart day/month drilldown

## Summary

Insights spending bar charts are now clickable: a day opens that day’s movements in Calendar; a month opens Movements filtered to expenses for that month.

## Product Changes

- **Gasto diario**: click a bar → `/insights/calendar?day=N` (sheet for that day).
- **Gasto mensual, 12 meses**: click a bar → set global month/year and open `/movements?tab=expenses`.
- Calendar reads `?day=` and auto-opens the day detail sheet.

## Validation

- On Insights, click a tall daily bar → calendar opens with that day’s expenses.
- Click a month bar → Movements shows expenses for that month.
- Zero-spend days still open calendar with the empty-day state when the bar column is targeted.
- Typecheck uses Recharts `activeIndex` (not removed `activePayload`) so `next build` passes.
