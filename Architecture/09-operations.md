# 09 — Operations

[← Cross-Cutting Concerns](08-cross-cutting-concerns.md) · [Index](README.md) · [Next: Architectural Decisions →](10-architectural-decisions.md)

---

## 9.1 Infrastructure

| Component | Identity |
|---|---|
| Repository | `github.com/Torrente179/budget-expense` (`main`) |
| Vercel project | `budget-expense` · `prj_SytGUpKEgA7YV1xmeBvCU48KTxCT` |
| Vercel team | `torrente179s-projects` · `team_vfwCy61qx1MxutGZJcyd3Tvd` |
| Production URL | `https://budget-expense-seven.vercel.app` |
| Supabase project | `Budget-Expense` · ref `awpygbfocmynxpadpsji` · `eu-west-1` |
| FX provider | `api.frankfurter.app` (ECB), with fallback |
| Local link file | `.vercel/project.json` |

Deployment is Vercel's default Git integration: push to `main` → build → deploy.
There is no CI pipeline, no test gate, and no staging environment in the
repository.

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable anon key>
NEXT_PUBLIC_SITE_URL=https://budget-expense-seven.vercel.app
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.frankfurter.app
SUPABASE_URL=https://awpygbfocmynxpadpsji.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_ACCESS_TOKEN=<Management API PAT — used by scripts/apply-sql.mjs>
```

Two notes:

- **`NEXT_PUBLIC_SITE_URL` is required for signup to work.** It becomes
  `emailRedirectTo` on the confirmation email. If it points at localhost in
  production, confirmation links break. This has bitten the project before —
  `changes/2026-07-18-fix-signup-confirmation-email.md`.
- **`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are vestigial as separate
  variables.** They existed to address the second ledger project. With one project
  left, they should point at the same instance as `NEXT_PUBLIC_SUPABASE_URL`. The
  `ledgerSupabase ?? appSupabase` fallback in the code depends on them being set.

`src/lib/supabase/env.ts` resolves these defensively, accepting either
`ANON_KEY` or `PUBLISHABLE_KEY` naming, preferring `NEXT_PUBLIC_*` (client-safe)
and falling back to server-only variants when `window` is undefined.

### Supabase Auth configuration

These dashboard settings must match production or confirmation emails fail:

| Setting | Required value |
|---|---|
| Site URL | `https://budget-expense-seven.vercel.app` |
| Redirect allow list | Production `/auth/callback` (+ `/**`), plus `http://localhost:3000/**` |
| Confirm email | Enabled (`mailer_autoconfirm = false`) |

Built-in Supabase SMTP is rate-limited to roughly 2–4 emails/hour on the free
tier. Custom SMTP is the documented remedy if signups ever spike.

---

## 9.2 The migration workflow

There is no migration runner. Schema changes are applied manually:

```bash
node scripts/apply-sql.mjs --project app --file supabase/migrations/2026-07-22-loans-receivables.sql
```

and verified with inline queries:

```bash
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_name='profiles'"
```

`apply-sql.mjs` derives the project ref from `.env.local` and calls the Supabase
Management API with `SUPABASE_ACCESS_TOKEN`. The `--project ledger` flag is
another vestige of the two-project era; both values now resolve to the same
instance.

### Consequences of manual migration

1. **Code can ship ahead of schema.** Hence the missing-table tolerance in
   `postgrest-errors.ts` and the graceful degradation described in
   [04 §4.5](04-api-surface.md#45-degradation-strategy).
2. **There is no rollback tooling.** Migrations are written defensively —
   `IF NOT EXISTS`, `DO $$ … EXCEPTION WHEN duplicate_object THEN NULL; END $$`
   — so re-running is safe, but reversing is manual.
3. **Applied status is tracked in prose,** in
   [`docs/pending-migrations-runbook.md`](../docs/pending-migrations-runbook.md)
   and `docs/APP.md` §14, not in a database table. Keeping those documents current
   is a genuine operational obligation.

---

## 9.3 Known operational hazards

### Free-tier auto-pause — the big one

The Supabase project pauses after roughly 7 days of inactivity. It has happened
repeatedly (June 2026, July 2026). A paused project still resolves over HTTPS, so
the failure presents as connection errors rather than DNS failure — easy to
misdiagnose as an application bug.

Diagnosis and recovery, from the handoff document:

```bash
TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.supabase.com/v1/projects/awpygbfocmynxpadpsji" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])"
```

If `INACTIVE`:

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/awpygbfocmynxpadpsji/restore" -d '{}'
```

Restore takes about two minutes to reach `ACTIVE_HEALTHY`, then Postgres needs a
further 20–60 seconds before queries stop returning `ECONNREFUSED`.

**This hazard has already caused permanent data loss once.** The second Supabase
project (`bahkswifojxcnesfcqbs`) was paused, then deleted, and became
unrecoverable (NXDOMAIN). The expense history had to be rebuilt from git-tracked
SQL and re-imported from bank exports. The documentation recommends a scheduled
keep-alive ping or a paid tier; neither is currently implemented.

### Data reconciliation history

The July 2026 reconciliation against the official Santander export grew the ledger
from 951 → 2,158 expenses and 83 → 208 income entries, extending coverage from
2025-09 back to 2024-08. The root cause of the gaps: earlier imports used Fintonic
CSV exports, which silently drop transactions — about 55 were missing, including
two salary payments.

Two operational rules came out of it, both still binding:

1. **The official bank export is the source of truth** for any future import or
   reconciliation — not a third-party aggregator.
2. Roughly 5% of expenses remain categorized as "Other" **by design** (ATM
   withdrawals, person-to-person Bizum transfers, self-transfers, genuinely
   unidentifiable merchants). This is an accepted floor, not a backlog.

### Other hazards

| Hazard | Detail |
|---|---|
| Auth URL misconfiguration | Site URL must be production, or confirmation emails break |
| SMTP rate limits | ~2–4 emails/hour on free tier |
| Schema-cache staleness | PostgREST caches schema; a dedicated migration exists to force reload |
| `listUsers` scan ceiling | Email resolution scans `perPage: 200`; breaks past 200 users |

---

## 9.4 Scripts

| Script | Purpose |
|---|---|
| `apply-sql.mjs` | **The** migration path — Management API SQL applier |
| `check-normalize-parity.mjs` | Gate: TS normalizers ≡ Python normalizers |
| `check-import-parity.mjs` | Gate: full import pipeline parity |
| `generate_santander_import.py` | Reference importer; the parity anchor |
| `generate_occidente_import.py` | Banco de Occidente (COP) importer |
| `generate_categorization_rules_seed.py` | Generates the rules seed SQL |
| `deduplicate-expenses.mjs` | Dedupe utility using the canonical key |
| `final-dedup.mjs` | Follow-up pass from the 2026-07 reconciliation |
| `merge-batches.mjs` | Import-batch merge tooling |

The last three are one-off reconciliation artifacts kept for reproducibility rather
than routine use.

---

## 9.5 Testing and quality gates

This is the thinnest part of the system, and it should be stated plainly.

| Gate | Command | Coverage |
|---|---|---|
| Balance math | `npm run test:balance` | `balance-checkpoint.ts` only |
| Import parity | `npm run check:parity` | Normalizers + import pipeline |
| Lint | `npm run lint` | ESLint (next/core-web-vitals + TS) |
| Types | `npm run build` | Full TypeScript check |
| Design system | Manual grep, 5 rules in `design.md` §7 | UI conventions |

**There is exactly one unit-test file in the repository**
(`src/lib/balance-checkpoint.test.ts`), run through Node's built-in test runner via
`tsx --test`. There are no component tests, no integration tests, no end-to-end
tests, and no CI configuration that runs any of them.

What partially compensates:

- TypeScript strict mode plus generated database types catch a large class of
  shape errors at build time.
- Zod schemas shared between forms and routes make contract drift impossible.
- The two areas with the highest correctness stakes and the least type-checkable
  logic — balance arithmetic and import parity — are precisely the two that *do*
  have automated checks.

That targeting is deliberate and sensible. But the absence of CI means even those
gates depend on someone remembering to run them. Making `npm run lint`,
`npm run build`, `test:balance`, and `check:parity` a GitHub Action would be the
highest-value operational improvement available, at very low cost.

---

## 9.6 Documentation practice

The project maintains an unusually disciplined documentation system.

| Document | Owns |
|---|---|
| `docs/APP.md` | Product handbook — IA, onboarding rules, capture rules, giving model, alerts, per-section composition, applied migrations, code map |
| `design.md` | Visual system of record — tokens, patterns, mobile rules, gates |
| `docs/vercel-supabase-handoff.md` | Infrastructure, env vars, recovery runbooks |
| `docs/pending-migrations-runbook.md` | Migration apply status and verification |
| `changes/` | ~100 dated per-change notes |
| `AGENTS.md` | Contributor guardrails |

`AGENTS.md` mandates that **every** user-facing or technical change adds a note to
`changes/` named `YYYY-MM-DD-short-kebab-title.md` with `Summary`, `Product
Changes`, `Data Model`, and `Validation` sections. The convention has been kept:
roughly 100 notes span 2026-04 to 2026-07.

This is why the codebase is unusually legible for a single-author project. The
change log records not just what changed but why, and the handbook records the
rules that emerged. Several architectural decisions in this report were
reconstructed directly from those notes.

`AGENTS.md` also carries a pointed warning worth repeating:

> This is NOT the Next.js you know. This version has breaking changes — APIs,
> conventions, and file structure may all differ from your training data. Read the
> relevant guide in `node_modules/next/dist/docs/` before writing any code.

That is why the middleware lives in `src/proxy.ts` exporting `proxy()` rather than
`src/middleware.ts` exporting `middleware()`.

---

[← Cross-Cutting Concerns](08-cross-cutting-concerns.md) · [Index](README.md) · [Next: Architectural Decisions →](10-architectural-decisions.md)
