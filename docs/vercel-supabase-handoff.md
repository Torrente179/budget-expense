# Vercel and Supabase Handoff

## Purpose
- This document explains how another engineer should connect this repository to the correct Vercel project and both Supabase projects.
- It also records where each piece of connection information comes from and which parts are public versus server-only.

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

## Supabase Projects

### 1. Public/Auth Project
- Project ref: `awpygbfocmynxpadpsji`
- Project URL: `https://awpygbfocmynxpadpsji.supabase.co`
- Purpose:
  - Browser auth/session
  - Public client initialization
- Environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable anon key>
```

### 2. Ledger Project
- Project ref: `bahkswifojxcnesfcqbs`
- Project URL: `https://bahkswifojxcnesfcqbs.supabase.co`
- Purpose:
  - Stores imported Santander expense and income data
  - Queried server-side through a service-role bridge
- Environment variables:
```env
SUPABASE_URL=https://bahkswifojxcnesfcqbs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

## Where To Get Supabase Info
- Supabase project URL and keys:
  - Supabase Dashboard → project selector → choose the project by ref
  - Settings → API
- Publishable/anon key:
  - Public/Auth project → Settings → API
- Service-role key:
  - Ledger project → Settings → API
- Database verification:
  - Supabase SQL Editor
  - Confirm the imported data under user `36534d1b-8f48-4b5c-8693-aae1673a222c`

## Required Environment Variables In Vercel

### Public
```env
NEXT_PUBLIC_SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable anon key>
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.frankfurter.app
```

### Server-only
```env
SUPABASE_URL=https://bahkswifojxcnesfcqbs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

## Important Security Note
- `SUPABASE_SERVICE_ROLE_KEY` must never be placed in `NEXT_PUBLIC_*`.
- Do not commit real secrets to git.
- Use Vercel envs or a local `.env.local` that is ignored by git.

## Current Architecture
- The app session still comes from the public/auth Supabase project.
- Expense and income ledger data is fetched from the separate ledger project.
- The bridge works by:
  1. Reading the logged-in user from the public/auth project.
  2. Resolving that user by email in the ledger project.
  3. Querying expenses and income entries from the ledger project with a service-role client.

## Code Locations For The Bridge
- [src/lib/supabase/service-role.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/lib/supabase/service-role.ts)
- [src/app/(app)/expenses/page.tsx](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/(app)/expenses/page.tsx)
- [src/app/api/expenses/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/expenses/route.ts)
- [src/app/api/expenses/[id]/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/expenses/[id]/route.ts)
- [src/app/api/incomes/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/incomes/route.ts)
- [src/app/api/incomes/[id]/route.ts](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/src/app/api/incomes/[id]/route.ts)

## Validation History
- The Santander March 2026 ledger query returned `585` expense rows for the target user.
- The production Vercel project `budget-expense` originally only had the public Supabase envs.
- The missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were added to `development`, `preview`, and `production`.
- `budget-expense-seven.vercel.app` was then redeployed and pointed at deployment `dpl_AEuBm9TyVSDDnL5vKUKjceWnLavB`.

## Related Change Notes
- [changes/2026-04-05-bridge-ledger-project-for-expenses-and-incomes.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-04-05-bridge-ledger-project-for-expenses-and-incomes.md)
- [changes/2026-04-05-cut-over-budget-expense-production-to-ledger-bridge.md](/Users/juanpabloramirez/Desktop/Budget%20&%20Expense/changes/2026-04-05-cut-over-budget-expense-production-to-ledger-bridge.md)
