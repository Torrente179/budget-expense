# 2026-07-03 — Stewardship layer: weekly review ritual + giving upgrade (Phase 5)

## Summary
- New `/review` page: a mobile-first, 2-minute weekly ritual in three steps — (1) one-tap categorize movements flagged `needs_review` (with "remember" teaching the importer a rule), (2) spending anomalies (category month-spend > trailing mean + 2σ, suppressed under 3 months of history), (3) recurring charges landing in the next 7 days — closing on a stewardship summary (giving rate vs target, savings rate, available this month).
- Giving insights upgraded: category `classification='giving'` is now authoritative (keywords remain the fallback) and the benchmark uses the configurable `tithe_target_percent` instead of the hardcoded 10%.

## Product Changes
- Sidebar + mobile drawer gain **Review / Revisión** (`ClipboardCheck`); the sidebar item shows a passive count badge when movements await categorization.
- Review is read-mostly by design: categorization is the only mutation — no snooze/dismiss persistence, keeping the 2-minute promise.

## Data Model
- None (uses Phase 0's `needs_review`, `categorization_rules`, `classification`, `tithe_target_percent`).

## Code Changes
- API: `GET /api/insights/review` (needs_review rows + count; degrades to empty pre-migration), `POST /api/categorization/rules` (user rule upsert, priority 5 — beats seeds), `PATCH /api/expenses/[id]` accepts `needs_review`, `/api/insights/household` now also returns month × category × currency totals for anomaly detection.
- Client: `src/app/(app)/review/page.tsx`, `src/components/review/review-flow.tsx`, `src/lib/insights/anomalies.ts`, `src/hooks/{use-review-queue,use-tithe-target}.ts`; `giving-insights.tsx` (classification check + configurable target), `use-household-insights.ts` (category month totals, converted), sidebar/mobile-nav entries.

## Validation
- `npx tsc --noEmit` clean; `npm run build` compiles `/review` + new routes; lint errors at 3 (all pre-existing in `calendar/page.tsx`); `npm run check:parity` still passes both gates.
- End-to-end ritual (import CSV with unknown merchants → categorize with remember → next import auto-categorizes; anomaly flagging on a seeded outlier) pending DB restoration per `docs/pending-migrations-runbook.md`.
