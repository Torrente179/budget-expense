# 2026-07-03 — Household stewardship metrics (Phase 3)

## Summary
- The dashboard gains a "Household stewardship" section computing, over the trailing 12 months: the **three-pillar rates** (giving % · spending % · savings % of income — they sum to 100%), **liquidity runway** (liquid reserves ÷ avg monthly essential spend), **net worth** (investments + brokerage cash + savings − liabilities), **kept-in-12-months**, and an **FX exposure** bar (% of household value by original currency, COP included).
- Settings gains three stewardship editors: giving target %, category classification (essential/discretionary/giving/savings), and a full liabilities editor with payment tracking.
- Exchange rates now cover COP by layering a secondary source over ECB, plus per-user manual overrides — every non-ECB rate is labeled.

## Product Changes
- Dashboard: new metrics section under the summary cards (mobile + desktop). Cards **prompt instead of faking**: runway asks you to tag essential categories when none are tagged; rates show "—" with an explanation when no income exists in the window.
- Settings: "Giving target" (replaces the hardcoded 10% benchmark), "Category classification" list (dual-writes both Supabase projects to keep mirrored category rows in sync — closes risk R1), "Liabilities" (loans/mortgages/credit with record-payment and delete; balance = original − Σ payments).
- FX exposure card notes when a currency's rate comes from a secondary or manual source.

## Data Model
- No new migrations (Phase 0 landed `categories.classification`, `profiles.tithe_target_percent`, `profiles.manual_fx_rates`, `liabilities`, `liability_payments`). All new UI degrades gracefully with a "pending migration" notice until they're applied.

## Code Changes
- API: `GET /api/insights/household` (12M ledger aggregates month × classification-bucket × currency + incomes + liabilities + tithe target; client converts, matching the summary-route pattern), `PATCH /api/categories/[id]` (**dual-write** app + ledger), `GET/POST /api/liabilities`, `PATCH/DELETE /api/liabilities/[id]`, `POST/DELETE /api/liabilities/[id]/payments`, `/api/exchange-rates` (ECB primary → open.er-api.com fills COP/gaps → labeled fallback; response gains `sources`).
- Client: `use-household-insights.ts`, `src/components/dashboard/household/{household-metrics,fx-exposure-card}.tsx` (one `useInvestments()` call composed for all cards), `src/components/settings/{stewardship-settings,category-classification,liabilities-editor}.tsx`, `currency-provider.tsx` (rate sources + manual overrides applied client-side, labeled "manual").

## Validation
- `npx tsc --noEmit` clean; `npm run build` compiles all five new routes; lint errors unchanged from baseline (5 pre-existing).
- Formula invariant: giving% + spending% + savings% = 100% by construction (savings is the remainder); zero-income window renders "—".
- Live checks pending DB restoration (runbook): COP fill from secondary source, dual-write verification via ledger `categories(*)` join, liability payment reducing net worth.
