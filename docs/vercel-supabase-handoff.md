# Vercel and Supabase Handoff

## Purpose
- This document explains how another engineer should connect this repository to the correct Vercel project and the Supabase project.
- It also records where each piece of connection information comes from and which parts are public versus server-only.

> **Superseded (2026-07-04):** this app used to bridge two Supabase projects (a public/auth project plus a separate "ledger" project for expense/income data). The ledger project (`bahkswifojxcnesfcqbs`) was on the free tier and was deleted after a pause — NXDOMAIN, unrecoverable. Everything was consolidated onto the single project below and the expense/income history was restored from git (`changes/2026-07-04-consolidate-single-supabase-project.md`). **Treat this as a single-project app.** The old two-project section is kept at the bottom of this file for historical context only — do not follow it.

## Repository
- GitHub repository: `https://github.com/Torrente179/budget-expense.git`
- Main branch: `main`
- Production domain in use: `https://budget-expense-seven.vercel.app`

## Vercel Project
- Team/scope: `torrente179s-projects`
- Team ID: `team_vfwCy61qx1MxutGZJcyd3Tvd`
- Project name: `budget-expense`
- Project ID: `prj_SytGUpKEgA7YV1xmeBvCU48KTxCT`
- Local link file: [`.vercel/project.json`](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/.vercel/project.json)

## How To Connect To Vercel
1. Authenticate the CLI:
```bash
vercel login
```
2. Link the local repo to the real production project:
```bash
cd "/Users/juanpabloramirez/Desktop/Budget & Expense"
vercel link --project budget-expense
```
3. Pull the current development environment:
```bash
vercel env pull .env.local
```
4. Inspect the current production deployment:
```bash
vercel inspect budget-expense-seven.vercel.app
```

## Where To Get Vercel Metadata
- Team, project name, project ID:
  - `vercel project inspect budget-expense`
  - or Vercel Dashboard → `torrente179's projects` → `budget-expense`
- Linked local project:
  - [`.vercel/project.json`](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/.vercel/project.json)
- Current env vars:
  - `vercel env list`
  - or Vercel Dashboard → `budget-expense` → Settings → Environment Variables
- Current production alias and deployment:
  - `vercel inspect budget-expense-seven.vercel.app`

## Supabase Project (single project, since 2026-07-04)
- Name: `Budget-Expense`
- Project ref: `awpygbfocmynxpadpsji`
- Project URL: `https://awpygbfocmynxpadpsji.supabase.co`
- Org: `torrente179's projects` (Vercel-managed)
- Region: `eu-west-1`
- Owner login: GitHub SSO as `pablopablo179@gmail.com`
- Purpose: auth/session **and** all expense/income/investment/liability data — there is no separate ledger project anymore.
- Primary auth user: `pablopablo179@gmail.com` (`36d56f02-711b-4eac-80df-803bdb599828`). Any SQL touching `auth.users` must resolve the right one. (`saldamo_gisela@hotmail.com` was deleted 2026-07-18 so that account can re-signup through onboarding.)

### Environment variables (single set)
```env
NEXT_PUBLIC_SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable anon key>
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.frankfurter.app
SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_ACCESS_TOKEN=<Management API personal access token — used by scripts/apply-sql.mjs>
```
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` still exist as separate vars for historical reasons (the code's `ledgerSupabase ?? appSupabase` fallback), but with no ledger project left they should just point at the same project as `NEXT_PUBLIC_SUPABASE_URL`.

## Where To Get Supabase Info
- Supabase project URL and keys:
  - Supabase Dashboard → project `Budget-Expense` (`awpygbfocmynxpadpsji`)
  - Settings → API
- Management API token (for `scripts/apply-sql.mjs`):
  - Supabase Dashboard → Account → Access Tokens
- Database verification:
  - Supabase SQL Editor, or `node scripts/apply-sql.mjs --project app --query "..."`
  - Confirm data under user `36d56f02-711b-4eac-80df-803bdb599828` (`pablopablo179@gmail.com`)

## Free-tier auto-pause — read this before assuming something is broken
The project pauses after ~7 days of inactivity (has happened repeatedly: Jun 2026, Jul 2026). A paused project resolves fine over HTTPS but the app gets connection errors. Check and fix:
```bash
TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2)
curl -s -H "Authorization: Bearer $TOKEN" "https://api.supabase.com/v1/projects/awpygbfocmynxpadpsji" | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])"
# If INACTIVE, restore it:
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/awpygbfocmynxpadpsji/restore" -d '{}'
# Poll until ACTIVE_HEALTHY (~2 min); Postgres needs a further ~20-60s warm-up
# before queries stop returning ECONNREFUSED.
```
Consider a scheduled keep-alive ping, or upgrading off the free tier, if this keeps recurring.

## Code Locations For Data Access
- [src/lib/supabase/service-role.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/lib/supabase/service-role.ts)
- [src/app/(app)/expenses/page.tsx](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/(app)/expenses/page.tsx)
- [src/app/api/expenses/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/expenses/route.ts)
- [src/app/api/expenses/[id]/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/expenses/[id]/route.ts)
- [src/app/api/incomes/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/incomes/route.ts)
- [src/app/api/incomes/[id]/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/incomes/[id]/route.ts)

## Data Reconciliation History (2026-07-17)
The ledger was reconciled end-to-end against the **official Santander xlsx export** (balance-chain verified, no gaps) after the free-tier pause was discovered and fixed:
- **951 → 2,158 expenses**, **83 → 208 income entries**.
- Full account history now covered: **2024-08-07 → present** (was 2025-09-10 → 2026-06-08).
- Root cause of the previous gaps: imports had relied on Fintonic CSV exports, which silently drop real transactions (~55 found missing, including two salary payments). The Santander export is now the source of truth for any future import/reconciliation — see `scripts/generate_santander_import.py`.
- Classification: pipeline rules (`categorization_rules` table) + three manual refinement passes on merchant patterns; ~5% of expenses remain in "Other" by design (ATM withdrawals, person-to-person Bizum transfers, self-transfers, and a handful of genuinely unidentifiable merchants).
- Real monthly rent recorded as **€550** (€300 bank transfer to landlord + €250 cash withdrawal the following day), both legs now categorized as Housing.
- SQL: `supabase/imports/2026-07-17-santander-reconciliation.sql`, `supabase/imports/2026-07-17-santander-historical-backfill.sql`.
- Change notes: `changes/2026-07-17-santander-reconciliation-import.md`, `changes/2026-07-17-santander-historical-backfill.md`.

## Product / schema docs (keep in sync)
- **Design system + product IA:** [`design.md`](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/design.md) — includes first-run onboarding (§8), in-app envelope alerts (§9), Screen back-nav, and language-control placement.
- **Migrations checklist:** [`docs/pending-migrations-runbook.md`](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/docs/pending-migrations-runbook.md) — includes pending `2026-07-18-onboarding-goals.sql` (profile onboarding/goals columns). Apply with `node scripts/apply-sql.mjs --project app --file …` before relying on `/onboarding` persistence in production.

## Related Change Notes
- [changes/2026-07-04-consolidate-single-supabase-project.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-07-04-consolidate-single-supabase-project.md) — the two-project → single-project migration
- [changes/2026-07-17-santander-reconciliation-import.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-07-17-santander-reconciliation-import.md)
- [changes/2026-07-17-santander-historical-backfill.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-07-17-santander-historical-backfill.md)
- [changes/2026-07-18-onboarding-goals-budget-alerts.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-07-18-onboarding-goals-budget-alerts.md) — skippable onboarding, goals personalization, envelope alerts, history back nav

---

## Historical: original two-project bridge (retired 2026-07-04, kept for context)

<details>
<summary>Click to expand — describes an architecture that no longer exists</summary>

### 1. Public/Auth Project
- Project ref: `awpygbfocmynxpadpsji` (this is now the single project — see above)

### 2. Ledger Project (deleted, unrecoverable)
- Project ref: `bahkswifojxcnesfcqbs`
- Project URL: `https://bahkswifojxcnesfcqbs.supabase.co` (NXDOMAIN since ~2026-07-04)
- Purpose: stored imported Santander expense and income data, queried server-side through a service-role bridge.

### Original Architecture
- The app session came from the public/auth Supabase project.
- Expense and income ledger data was fetched from the separate ledger project.
- The bridge worked by:
  1. Reading the logged-in user from the public/auth project.
  2. Resolving that user by email in the ledger project.
  3. Querying expenses and income entries from the ledger project with a service-role client.

### Validation History (pre-consolidation)
- The Santander March 2026 ledger query returned `585` expense rows for the target user.
- The production Vercel project `budget-expense` originally only had the public Supabase envs.
- The missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were added to `development`, `preview`, and `production`.
- `budget-expense-seven.vercel.app` was then redeployed and pointed at deployment `dpl_AEuBm9TyVSDDnL5vKUKjceWnLavB`.

### Related Change Notes (pre-consolidation)
- [changes/2026-04-05-bridge-ledger-project-for-expenses-and-incomes.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-04-05-bridge-ledger-project-for-expenses-and-incomes.md)
- [changes/2026-04-05-cut-over-budget-expense-production-to-ledger-bridge.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-04-05-cut-over-budget-expense-production-to-ledger-bridge.md)

</details>
