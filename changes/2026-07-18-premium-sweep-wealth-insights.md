# App-wide premium sweep: kill pills, rework Wealth & Insights

## Summary

Applied the "no pills" philosophy across the whole app and did complete
reworks of Wealth and Insights. Every remaining tacky pattern — uppercase
tinted status pills, filled tab chips, boxy `border + bg-secondary` mini-blocks
— is replaced with quiet, premium equivalents.

## Product Changes

- **New shared patterns:**
  - `StatusTag` (`src/components/patterns/status-tag.tsx`): a small tone dot +
    label in ink, replacing every `rounded-full … uppercase tracking-widest`
    status pill (Buy/Sell, Deposit/Withdrawal, Transfer, Over, etc.).
  - `BreakdownDonut` (`src/components/patterns/breakdown-donut.tsx`): one donut
    with center total + live legend (share % and amount), now shared by Home
    ("Where it went") and Wealth (allocation). Removes the duplicated inline
    PieChart from Home.
- **Wealth overview reworked** (`wealth-overview.tsx`): net worth + allocation
  donut together in one hero card; a 3-up stat row (runway, kept 12mo, debts);
  premium jump-in links to Investments/Savings/Debts with balances; FX exposure
  in a titled card (new `variant="bare"` on `FxExposureCard`).
- **Investments page reworked** (`wealth/investments/page.tsx`): the Base-UI
  `Tabs` component replaced with `UnderlineTabs`; boxy `border bg-secondary`
  mini-stat blocks replaced with clean `MiniStat` label+number; broker/holdings
  side panels rebuilt as quiet hover-reveal rows.
- **Insights reworked** (`insights-screen.tsx`): envelope-utilization and
  income-source rows de-boxed into clean rows; the "Over" pill is now a
  `StatusTag`; income sources show inline share.
- **Underline navigation everywhere:** migrated the remaining `Tabs` usages —
  Wisdom sections and the Import review filter — to `UnderlineTabs`. No filled
  tab chips remain; `@/components/ui/tabs` has zero consumers.

## Validation

- `npm run build` clean (49 routes); lint 0 errors (18 pre-existing warnings).
- Gate greps: zero uppercase status pills, zero `ui/tabs` consumers, zero raw
  status-color utilities in `src/`.
