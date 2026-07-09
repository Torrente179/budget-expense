# Pending Migrations Runbook — 2026-07-03 (S-tier roadmap)

Four SQL files are written but **not applied to any live database**. This page
says exactly what to run, where, and why it was blocked.

## Why it was blocked
- The ledger project `bahkswifojxcnesfcqbs.supabase.co` does not resolve
  (NXDOMAIN) — most likely **paused** (free-tier auto-pause; the same thing
  happened in June per `changes/2026-06-08-refresh-santander-movements.md`).
- The app project in the local `.env.local` (`awpygbfocmynxpadpsji`) is a
  **stale shell**: it has only `profiles`, `categories` (the 12 defaults),
  `expenses` (3 rows), `budgets` — while the code also queries
  `monthly_budget_plans` and `investment_savings_transfers` on it. Production
  almost certainly uses different env values.
- The `SUPABASE_ACCESS_TOKEN` in `.env.local` works for the app project's
  Management API but gets 403 on the ledger project.

## Step 1 — Restore the environment
```bash
# Resume the ledger project in the Supabase dashboard if paused, then:
vercel login
cd "/Users/juanpabloramirez/Desktop/Budget & Expense"
vercel env pull .env.local   # refresh to the real production values
```
Sanity check both projects resolve and hold the expected data:
```bash
node scripts/apply-sql.mjs --project app    --query "SELECT count(*) FROM public.categories"
node scripts/apply-sql.mjs --project ledger --query "SELECT count(*) FROM public.expenses"
# (if the ledger 403s on the Management API, run the SQL below in its SQL Editor instead)
```

## Step 2 — Apply, in this order

| File (in `supabase/migrations/`) | Ledger project | App project |
|---|---|---|
| `2026-07-03-ledger-import-foundations.sql` | ✅ | ✅ |
| `2026-07-03-category-classification.sql` | ✅ | ✅ |
| `2026-07-03-profile-settings-liabilities.sql` | — | ✅ |
| `2026-07-03-seed-categorization-rules.sql` | ✅ (wherever `categorization_rules` will be read — ledger is primary) | ✅ (harmless; idempotent) |

Via script (works where the Management API token has access):
```bash
node scripts/apply-sql.mjs --project app --file supabase/migrations/2026-07-03-ledger-import-foundations.sql
# …repeat per the table above; use --project ledger for the ledger project
```
Otherwise paste the file contents into the project's SQL Editor. Every file is
idempotent (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`) — safe to re-run.

**Caveat for the app-project shell:** `2026-07-03-ledger-import-foundations.sql`
touches `income_entries`, which the stale shell lacks. On the REAL app project
this should exist; if it doesn't, apply the `income_entries` section of
`supabase/migration.sql` first, or accept that the fallback path stays
expenses-only.

## Step 3 — Verify
```bash
node scripts/apply-sql.mjs --project ledger --query "SELECT source_kind, count(*) FROM public.expenses GROUP BY 1"
node scripts/apply-sql.mjs --project ledger --query "SELECT count(*) FROM public.categorization_rules"
node scripts/check-normalize-parity.mjs
```
Then run the app and check: movimientos list, dashboard, add/edit/delete
expense + income, month navigation, recurring sync.
