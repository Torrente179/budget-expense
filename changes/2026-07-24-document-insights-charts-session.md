# Document Insights charts session

## Summary

Synced project documentation (English — the language of all handbook / design /
architecture docs) with the 2026-07-24 Insights work: remove duplicate category
list, daily spend bars, magenta series color, and day/month drilldown.

## Product Changes

Documentation only — no runtime behavior change in this note.

Updated:

- `docs/APP.md` — §1 Insights row, §12 composition + drilldown, key code map,
  §19 related change notes
- `design.md` — Insights owns, `SPEND_CHART_COLOR` hard-code exception, charts
  token note, charts/ folder blurb, quick reference
- `Architecture/01-system-overview.md` — Insights owns row
- `Architecture/05-frontend-architecture.md` — charts tier + Insights spend
  chart behavior + color tokens

Runtime change notes for the same session (already shipped):

- `2026-07-24-remove-duplicate-insights-category-chart.md`
- `2026-07-24-insights-daily-spend-chart.md`
- `2026-07-24-insights-chart-day-month-drilldown.md`

## Data Model

None.

## Validation

- Spot-check §12 against `insights-screen.tsx` / `insights-trend-charts.tsx` /
  `calendar-screen.tsx`.
- Confirm docs state category bars live only in the monthly report.
- Confirm docs state chart clicks use Recharts `activeIndex`.
