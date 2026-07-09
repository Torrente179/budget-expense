# 2026-07-03 — Foundations: schema front-load + query layer (S-tier roadmap Phase 0)

## Summary
- First phase of the S-tier roadmap: no user-visible features, but every later phase (in-app CSV import, quick-add, household metrics, review ritual) builds on this.
- Added migrations for import provenance, import batches, categorization rules, category classification, stewardship profile settings, and liabilities tracking.
- Introduced TanStack Query as the client data layer for the four transactional hooks, replacing hand-rolled fetch+state and the browser HTTP prefetch cache.
- Ported the Python import script's text normalizers to TypeScript with a byte-parity gate, and centralized the 5-field dedupe key shared by both import paths.

## Product Changes
- None visible. Month navigation prefetch now goes through the react-query cache instead of browser HTTP cache; add/edit/delete flows behave identically (return-shape-compatible hook rewrites).

## Data Model
New migrations in `supabase/migrations/` (also inlined in `supabase/migration.sql`); **NOT yet applied to live databases** — see `docs/pending-migrations-runbook.md`:
- `2026-07-03-ledger-import-foundations.sql` (BOTH projects): `expenses` + `income_entries` gain `source_kind` (`manual|import_csv|import_script|recurring`), `external_ref` (partial unique per user), `import_batch_id`, `needs_review`; new `import_batches` (JSONB staging rows, status lifecycle) and `categorization_rules` (merchant_keyword/bank_category patterns, priority, seed/user source) with RLS.
- `2026-07-03-category-classification.sql` (BOTH projects): `categories.classification` (`essential|discretionary|giving|savings`, default discretionary) + name-based seed UPDATEs (EN+ES).
- `2026-07-03-profile-settings-liabilities.sql` (app project): `profiles.tithe_target_percent` (default 10), `profiles.manual_fx_rates` JSONB; new `liabilities` + `liability_payments` tables with RLS (current balance = original − Σ payments).
- `2026-07-03-seed-categorization-rules.sql`: 201 rules generated from the Python script's maps by `scripts/generate_categorization_rules_seed.py` (regenerate, never hand-edit).
- `src/types/database.ts` updated to match.

## Code Changes
- New: `src/lib/query/{client,keys,authorized-fetch,fetchers}.ts`, `src/providers/query-provider.tsx`, `src/lib/ledger/dedupe.ts`, `src/lib/ledger/normalize.ts`, `scripts/check-normalize-parity.mjs`, `scripts/apply-sql.mjs`, `scripts/generate_categorization_rules_seed.py`.
- Rewritten internals (unchanged return shapes): `use-expenses`, `use-incomes`, `use-categories`, `use-monthly-summary`, `use-prefetch-months`.
- `(app)/layout.tsx` mounts `QueryProvider`; `/api/expenses`, `/api/incomes`, `/api/dashboard/summary` GETs no longer send `Cache-Control` (removed `src/lib/api-cache.ts`, `src/lib/prefetch.ts`); `/api/admin/deduplicate` now imports `buildExpenseDedupeKey`.

## Validation
- `npx tsc --noEmit` clean; `npm run build` succeeds; lint error count identical to pre-change baseline (5 pre-existing in `movimientos-page.tsx`).
- `node scripts/check-normalize-parity.mjs` passes: 20 fixture concepts × 3 functions + amounts + dates byte-identical between Python and TS.
- Migrations verified transactional via Management API (a failed run rolled back cleanly; nothing partially applied).
- **Blocked / user action required:** live DBs unreachable from this environment — the ledger project host (`bahkswifojxcnesfcqbs.supabase.co`) is NXDOMAIN (paused or moved) and the local `.env.local` app project (`awpygbfocmynxpadpsji`) is a stale shell missing tables the code queries (`income_entries`, `monthly_budget_plans`, `investment_savings_transfers`, …). Manual regression of live flows deferred until env is refreshed (`vercel env pull`) and migrations are applied per the runbook.
