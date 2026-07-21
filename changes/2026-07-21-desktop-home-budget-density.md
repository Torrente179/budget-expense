# Desktop home density for budgets & donut

## Summary

Desktop Home no longer stretches a giant ring + full-width budget bar. Mobile keeps a compact ring + list; desktop uses a dense status strip and a multi-column budget grid that scales when plans create many budgets. The “Where it went” donut is smaller on desktop so the legend leads.

## Product Changes

- **Monthly budgets (desktop):** remaining amount + % used badge + thin pace bar; budgets in a 2–3 column tile grid with short bars.
- **Monthly budgets (mobile):** unchanged chart-forward layout (72px ring beside the list).
- **Where it went:** ring ~128px on phone, ~96px from `md` up; denser legend rows with scroll when long.

## Data Model

None.

## Validation

- Desktop Home with 1 budget and with 6+ budgets: grid wraps without oversized empty space.
- Mobile Home still shows the pace ring.
- Donut category rows remain clickable to category insights.
