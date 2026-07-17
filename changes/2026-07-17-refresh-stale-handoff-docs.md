# Refresh stale handoff/runbook docs to match single-project reality

## Summary
`docs/vercel-supabase-handoff.md` and `docs/pending-migrations-runbook.md`
still described the two-Supabase-project bridge (public/auth project +
separate "ledger" project) that was retired on 2026-07-04 when the ledger
project was found deleted and everything was consolidated onto the single
`awpygbfocmynxpadpsji` project. Both docs would have sent a future engineer
down a dead path. Rewrote both to describe current reality and folded in the
2026-07-17 data reconciliation (see
`changes/2026-07-17-santander-reconciliation-import.md` and
`changes/2026-07-17-santander-historical-backfill.md`).

## Product Changes
None — documentation only.

## Data Model
None.

## Validation
- Cross-checked every fact restated (project ref, env var names, applied
  migrations, row counts, user IDs) against the live database via
  `scripts/apply-sql.mjs` and against `changes/2026-07-04-consolidate-single-supabase-project.md`.
- Old two-project instructions kept in `vercel-supabase-handoff.md` under a
  collapsed "Historical" section rather than deleted, for context on past
  incidents (both handoff docs are read by future engineers/agents, so intent
  and history matter as much as current state).
