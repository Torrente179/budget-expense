# 2026-07-04 — Consolidate onto a single Supabase project + restore data

## Summary
- The separate "ledger" Supabase project (`bahkswifojxcnesfcqbs`) that held expense/income history was found **deleted** (free-tier, NXDOMAIN, unrecoverable). Consolidated everything onto the reachable app project (`awpygbfocmynxpadpsji`) and restored the data from git.
- The app is now single-project. All the 2026-07-03 roadmap features are live-capable.

## Product Changes
- None to UI. Production redeployed so the live site reads from the consolidated database instead of the dead ledger.

## Data Model
- Applied the full schema (catch-up migrations `2026-04-04-sync-feature-tables`, `2026-04-07-custom-budgets`) plus all four 2026-07-03 migrations (import foundations, category classification, profile settings + liabilities, categorization-rules seed) to the app project.
- **Restored expense/income history** by replaying the three `import-expenses.sql` generations from git history (commits 4615348, eaaaf51, 49205e8), each patched to resolve the user by email (`pablopablo179@gmail.com`) since the app project has two auth users. Result: **951 expenses** (2025-09-10 → 2026-06-08), **83 incomes**, **200 categorization rules**, **8 classified categories**. The ~10 same-day duplicate groups are original-pipeline behavior, not replay artifacts.
- Known gap: the 19 one-time IBKR trades were never captured in git SQL and need manual re-entry.

## Environment
- `.env.local`: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` repointed to the app project; service key rotated via the Management API. Backup: `.env.local.bak-pre-consolidation`.
- Vercel: deleted the 6 stale ledger-bridge vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY across Production/Preview/Development) and redeployed production (Ready). With no service-role env present, the `ledgerSupabase ?? appSupabase` fallback resolves directly against the app project.
- Added `scripts/apply-sql.mjs` (Management-API SQL runner) and `.claude/launch.json` (dev server).

## Validation
- Service-role smoke test: 951 expenses + 200 rules visible for the resolved user via the rotated key.
- Dev server boots clean (no server errors); `/login` 200, `/api/exchange-rates` 200 now returning **COP 3340.6 sourced from `open-er-api`** and EUR from `ecb` — the Phase 3 COP fix confirmed working live.
- Production redeploy succeeded (Vercel shows Ready, live on budget-expense-seven.vercel.app).
- Remaining: authenticated per-feature UI validation (import → review → commit, quick-add, review ritual) requires the user's app-project login; the pieces are verified at the data/API layer.
