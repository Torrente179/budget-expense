# Migrations Runbook — S-tier roadmap (2026-07-03)

> **Status: RESOLVED (2026-07-04).** All four migrations below were applied to
> the single live project (`awpygbfocmynxpadpsji`) as part of
> `changes/2026-07-04-consolidate-single-supabase-project.md`. The env-restoration
> blocker described below is historical — kept so a future migration knows what
> "blocked" looked like and how it was fixed. The two-project split it refers to
> (`ledger` vs `app`) no longer exists; see `docs/vercel-supabase-handoff.md`.

## What was blocked, and why (historical)
- The ledger project `bahkswifojxcnesfcqbs.supabase.co` did not resolve
  (NXDOMAIN) — it turned out to be **deleted**, not just paused (free-tier).
- The app project in the local `.env.local` (`awpygbfocmynxpadpsji`) was a
  **stale shell** at the time: only `profiles`, `categories` (12 defaults),
  `expenses` (3 rows), `budgets` — while the code also queried
  `monthly_budget_plans` and `investment_savings_transfers` on it.
- The `SUPABASE_ACCESS_TOKEN` in `.env.local` worked for the app project's
  Management API but got 403 on the ledger project.

## How it was actually resolved
Consolidation, not restoration of the old bridge: the ledger project was gone
for good, so everything (schema + data) was moved onto the app project instead.
1. Applied the full schema (catch-up migrations
   `2026-04-04-sync-feature-tables`, `2026-04-07-custom-budgets`) plus the four
   2026-07-03 migrations below — all to the single app project.
2. Restored expense/income history by replaying the three `import-expenses.sql`
   generations from git history, patched to resolve the user by email.
3. Repointed `.env.local` and Vercel env vars at the single project; deleted
   the stale ledger-bridge vars from Vercel.

Full detail: `changes/2026-07-04-consolidate-single-supabase-project.md`.

## Migrations applied (all four, single project)

| File (in `supabase/migrations/`) | Applied to `awpygbfocmynxpadpsji` |
|---|---|
| `2026-07-03-ledger-import-foundations.sql` | ✅ 2026-07-04 |
| `2026-07-03-category-classification.sql` | ✅ 2026-07-04 |
| `2026-07-03-profile-settings-liabilities.sql` | ✅ 2026-07-04 |
| `2026-07-03-seed-categorization-rules.sql` | ✅ 2026-07-04 |

Every file is idempotent (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`) — safe to
re-run against the same project if you need to confirm.

```bash
node scripts/apply-sql.mjs --project app --file supabase/migrations/2026-07-03-ledger-import-foundations.sql
# ...repeat per file above; --project app is the only project now
```

## Verifying the current state
```bash
node scripts/apply-sql.mjs --project app --query "SELECT source_kind, count(*) FROM public.expenses GROUP BY 1"
node scripts/apply-sql.mjs --project app --query "SELECT count(*) FROM public.categorization_rules"
node scripts/check-normalize-parity.mjs
```
As of 2026-07-17 (post data reconciliation, see
`changes/2026-07-17-santander-reconciliation-import.md` and
`changes/2026-07-17-santander-historical-backfill.md`): **2,158 expenses**,
**208 income entries**, **200 categorization rules**, history covering
**2024-08-07 → present**.

## Pending / apply on deploy (post S-tier)

| File (in `supabase/migrations/`) | Purpose | Status |
|---|---|---|
| `2026-07-18-onboarding-goals.sql` | Profile columns for skippable onboarding + goals (`onboarding_completed_at`, `onboarding_skipped_at`, `wants_budget_help`, `primary_goals`) | ✅ Applied 2026-07-18 on `awpygbfocmynxpadpsji` |
| `2026-07-18-household-insights-aggregates-app.sql` | `liability_payment_totals` RPC + index | ✅ Applied 2026-07-18 on `awpygbfocmynxpadpsji` |
| `2026-07-18-household-insights-aggregates-ledger.sql` | Household expense/income aggregate RPCs (applied on app — single project) | ✅ Applied 2026-07-18 on `awpygbfocmynxpadpsji` |

```bash
node scripts/apply-sql.mjs --project app --file supabase/migrations/2026-07-18-onboarding-goals.sql
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND (column_name LIKE 'onboarding%' OR column_name IN ('wants_budget_help','primary_goals'))"
```

Product behavior is documented in `design.md` §8–§9 and
`changes/2026-07-18-onboarding-goals-budget-alerts.md`. Until the migration
runs, the client hook soft-falls back (onboarding fields treated as empty) so
the app does not hard-crash.

## If the project won't connect at all
Before assuming a migration or schema problem, check whether the project is
simply **paused** (free-tier auto-pause after ~7 days idle — has happened more
than once). See the "Free-tier auto-pause" section in
`docs/vercel-supabase-handoff.md` for the restore command.
