# Budget & Expense

Bilingual (EN/ES) personal stewardship, budgeting, and expense-tracking app.

**Production:** https://budget-expense-seven.vercel.app  
**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Vercel

## Documentation

| Doc | Purpose |
|---|---|
| [`docs/APP.md`](docs/APP.md) | **Start here** — product handbook (IA, onboarding, alerts, Home/Budget, schema status, code map) |
| [`docs/balance-carryover.md`](docs/balance-carryover.md) | Canonical Home available-balance contract: formulas, date rules, fallbacks, data flow, edge cases, tests, and troubleshooting |
| [`docs/performance-and-rebuild-plan.md`](docs/performance-and-rebuild-plan.md) | Performance baseline, recovery contracts, rollout/rollback, and future Vite/Go architecture |
| [`design.md`](design.md) | Design system: tokens, patterns, mobile rules, visual gates |
| [`docs/vercel-supabase-handoff.md`](docs/vercel-supabase-handoff.md) | Vercel + Supabase connection and ops |
| [`docs/pending-migrations-runbook.md`](docs/pending-migrations-runbook.md) | Migration apply checklist |
| [`changes/`](changes/) | Implementation change log |

## Local development

```bash
npm install
# Ensure .env.local has Supabase + exchange URL (see handoff doc)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Financial-logic checks

```bash
npm run test:home       # Home carried balance vs month-plan fallback
npm run test:balance    # Checkpoint ordering and tracked-balance math
npm run test:wealth     # Net-worth composition
npx tsc --noEmit        # Type check without emitting files
```

## Apply SQL to Supabase

```bash
node scripts/apply-sql.mjs --project app --file supabase/migrations/<file>.sql
node scripts/apply-sql.mjs --project app --query "SELECT 1"
```

Agent notes for this repo: [`AGENTS.md`](AGENTS.md).
