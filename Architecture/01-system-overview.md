# 01 — System Overview

[← Index](README.md) · [Next: Layered Architecture →](02-layered-architecture.md)

---

## 1.1 Product shape

Budget & Expense is a personal finance application organized around a
**stewardship** philosophy rather than a conventional budgeting metaphor: income
arrives, a share is given away first, the rest is planned into objectives
("envelopes"), spending is tracked against them, and wealth accumulates in a
separate ledger of things owned and owed.

The information architecture is deliberately narrow — **five primary sections**,
enforced by a single navigation source of truth
([`src/lib/navigation.ts`](../src/lib/navigation.ts)):

| Section | Route | Owns | Editorial rule |
|---|---|---|---|
| **Home** | `/home` | Compact blue hero (`remaining = income − spent`); Presupuesto cards only (`spending_limit`); category donut; recent movements | *Now + actionable* |
| **Movements** | `/movements`, `/movements/recurring` | Unified expense + income ledger, filters, search, swipe-delete, recurring charges | The ledger itself |
| **Budget** | `/budget` | Dual engines: Presupuestos (ceilings) + Metas (floors); compact hero; methods seed by `budget_role` → `kind` | Planning |
| **Wealth** | `/wealth` + `/investments`, `/savings`, `/liabilities`, `/loans` | Net worth, allocation, runway, FX exposure, holdings, debts, money lent | *Balances* |
| **Insights** | `/insights` + `/calendar`, `/categories/[id]` | Ratios, pillars, clickable 12-month + daily spend bars, envelope use, anomalies, monthly report (category bars), calendar day drilldown | *Past + patterns* — no data-entry CTAs |

Secondary destinations — `/review`, `/import`, `/wisdom`, `/settings` — are
reachable from the desktop sidebar, the mobile profile sheet, and a ⌘K command
menu. `/onboarding` is a first-run wizard outside the primary navigation.

The **editorial rule** is a genuine architectural constraint, not just style
guidance: *a metric may not live in more than one section*. It is the
tie-breaker used when deciding where a new feature goes, and it explains why,
for example, net worth appears only in Wealth and never on Home.

---

## 1.2 Technology stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.2 | App Router; `proxy.ts` replaces the old `middleware.ts` convention |
| UI runtime | React | 19.2.4 | Server Components by default; `"use client"` where interactive |
| Language | TypeScript | 5.x | Strict; `@/*` → `src/*` path alias |
| Styling | Tailwind CSS | v4 | CSS-first config via `@theme inline`; no `tailwind.config.js` |
| Components | Base UI + shadcn | `base-nova` style | 23 primitives vendored into `components/ui/` |
| Data store | Supabase (Postgres) | — | Single project `awpygbfocmynxpadpsji`, region `eu-west-1` |
| Auth | Supabase Auth | `@supabase/ssr` 0.10 | Email/password with confirmation; cookie sessions |
| Server state | TanStack Query | v5 | 60s `staleTime`, explicit invalidation |
| Virtualization | TanStack Virtual | v3 | Long ledger lists |
| Forms | React Hook Form + Zod | 7.x / 4.x | Zod schemas shared between client forms and API routes |
| Charts | Recharts | v3 | Centrally themed; inline tooltip styles banned |
| Motion | Framer Motion | v12 | Opacity-only route transitions |
| Icons | lucide-react | v1.7 | |
| Toasts | Sonner | v2 | Destructive actions offer Undo |
| Theming | next-themes | 0.4 | Class strategy, **light by default** |
| Hosting | Vercel | — | Project `budget-expense`, team `torrente179s-projects` |

**Notable absences**, all deliberate: no state management library (React Query +
Context suffices), no i18n framework (a two-argument `t(en, es)` function), no
component library beyond vendored primitives, no ORM (the Supabase client is used
directly with generated types), no test framework beyond Node's built-in test
runner.

---

## 1.3 Deployment topology

```
                    ┌──────────────────────────────────────┐
   Browser / PWA ──▶│  Vercel Edge — budget-expense        │
                    │  ┌────────────────────────────────┐  │
                    │  │ proxy.ts (runs on every route) │  │
                    │  │  → updateSession()             │  │
                    │  │  → auth + onboarding redirects │  │
                    │  └────────────────────────────────┘  │
                    │  ┌────────────────────────────────┐  │
                    │  │ React Server Components        │  │
                    │  │ 28 Route Handlers (/api/*)     │  │
                    │  └────────────────────────────────┘  │
                    └───────────────┬──────────────────────┘
                                    │ HTTPS
                    ┌───────────────▼──────────────────────┐
                    │  Supabase — awpygbfocmynxpadpsji     │
                    │  (eu-west-1, free tier)              │
                    │   • Auth (auth.users)                │
                    │   • Postgres: 25 tables, RLS on all  │
                    │   • 3 trigger fns + 3 aggregate RPCs │
                    └──────────────────────────────────────┘
                                    ▲
                    ┌───────────────┴──────────────────────┐
                    │  Ops path (developer laptop)         │
                    │  scripts/apply-sql.mjs               │
                    │   → Supabase Management API          │
                    └──────────────────────────────────────┘

   External: api.frankfurter.app (ECB FX rates, with fallback provider)
```

Three important properties of this topology:

1. **There is no backend service.** The Next.js route handlers *are* the backend.
   There is no queue, no cron, no background worker. Anything that must happen
   periodically (recurring-charge materialization) is triggered by a client
   request instead — see [§1.4](#14-the-request-lifecycle).

2. **Migrations do not run in CI.** They are applied manually from a developer
   machine through the Supabase Management API using
   [`scripts/apply-sql.mjs`](../scripts/apply-sql.mjs). Deployment and schema
   change are therefore decoupled, which is why the codebase carries
   missing-table tolerance (see [`postgrest-errors.ts`](../src/lib/supabase/postgrest-errors.ts)).

3. **The database is on the free tier and auto-pauses** after ~7 days of
   inactivity. This has happened repeatedly and once caused permanent data loss
   in a since-retired second project. See [09 — Operations](09-operations.md#93-known-operational-hazards).

---

## 1.4 The request lifecycle

Understanding one full round trip explains most of the system. Here is what
happens when a signed-in user opens Home and adds an expense.

### Phase A — Page request

```
GET /home
  │
  ├─▶ proxy.ts  (matcher excludes _next/static, images, favicon, manifest)
  │     └─▶ updateSession(request)                    lib/supabase/middleware.ts
  │           ├─ createServerClient with cookie get/setAll adapters
  │           ├─ supabase.auth.getUser()      ← refreshes the session cookie
  │           ├─ no user + not /login|/signup|/auth|/api  → redirect /login
  │           ├─ user + on /login|/signup → read profiles.onboarding_*
  │           │     └─ new account (created_at ≥ 2026-07-18, both flags null)
  │           │          ? redirect /onboarding : redirect /home
  │           └─ return response carrying refreshed cookies
  │
  ├─▶ app/layout.tsx  (Server Component)
  │     ├─ headers().get("accept-language") → localeFromAcceptLanguage()
  │     ├─ <html lang={initialLocale}>  ← correct language on first paint
  │     └─ ThemeProvider > LocaleProvider > TooltipProvider > {children} + Toaster
  │
  ├─▶ app/(app)/layout.tsx  ("use client")
  │     └─ QueryProvider > CurrencyProvider > MonthProvider > OnboardingGate
  │          └─ Sidebar | Topbar | TabBar | CaptureFab   (all hidden on /onboarding)
  │
  └─▶ app/(app)/home/page.tsx → <HomeScreen />
```

Two subtleties worth noting. First, `proxy.ts` wraps `updateSession` in a
`try/catch` that falls through to `NextResponse.next()` — if Supabase environment
variables are absent, the app renders unauthenticated rather than crashing.
Second, the onboarding decision is made **twice**: once in the proxy (server,
authoritative) and once in `OnboardingGate` (client, soft). They share the same
rule and the same React Query cache key so they cannot disagree.

### Phase B — Data fetch

```
HomeScreen
  ├─ useMonth()      → { month, year }        (global, survives section switches)
  ├─ useCurrency()   → { baseCurrency, convert, rates }
  └─ useMonthlySummary({ month, year })
       └─ useQuery(queryKeys.monthlySummary(month, year, asOfDate))
            └─ fetchMonthlySummaryRaw()
                 └─ authorizedFetch("/api/dashboard/summary?…")
                      ├─ supabase.auth.getSession() → Bearer token
                      └─ fetch(credentials: "include")
                           │
                           ▼
                    GET /api/dashboard/summary
                      ├─ Zod: { month 1-12, year 2020-2100, asOf? ISO }
                      ├─ createRequestClient(request)
                      │    ├─ Authorization: Bearer … → verify → accessToken client
                      │    └─ else cookie-based server client
                      ├─ createServiceRoleClient() + resolveServiceRoleUserByEmail()
                      │    → effective (ledger) user id, 5-min in-memory cache
                      └─ Promise.all([
                           expenses(+categories join), incomes, prev-month expenses,
                           budgets, monthly plan, investment transfers,
                           prev investment transfers
                         ]) + latest balance_checkpoint ≤ target date
                      → raw, UNCONVERTED rows
```

The response is deliberately raw. `useMonthlySummary` then derives roughly twenty
metrics in a `useMemo` — total spent, total income, net flow, month-to-date flow,
tracked balance, giving spent, category breakdown, daily spending, previous-month
comparison — applying `convert()` per row. Because conversion is client-side, a
change to the base currency or to FX rates recomputes everything **without a
network request**.

### Phase C — Write

```
User taps FAB → CaptureSheet (mounted, stays mounted while open)
  └─ submit → useCapture().addExpense(values, category)
       ├─ onMutate:  optimistic row inserted into ["expenses", year, month]
       ├─ POST /api/expenses
       │    ├─ Zod expenseSchema
       │    ├─ createRequestClient → user
       │    ├─ service-role client + email-resolved user id
       │    └─ insert(...).select("*, categories(*)").single()
       ├─ onError:   invalidate month key, toast error, SHEET STAYS OPEN
       └─ onSuccess:
            ├─ invalidate expensesAll + monthlySummaryAll
            ├─ toast "Expense added" with 5s Undo → DELETE /api/expenses/:id
            └─ notifyEnvelopeLimitsAfterExpense()
                 └─ recompute envelopes for that month
                      └─ ≥75/90/100% → toast.warning/error, action → /budget
                           (deduped per envelope+threshold in sessionStorage)
```

The invalidation of `monthlySummaryAll` is what makes Home update: the summary
query refetches, `useMonthlySummary` re-derives, and every dependent surface
(stat row, donut, pace bar, attention feed) updates from one source.

---

## 1.5 Repository map

```
Budget & Expense/
├── src/
│   ├── proxy.ts                  Next 16 edge proxy — auth gate for every request
│   ├── app/                      App Router
│   │   ├── layout.tsx            Root: fonts, PWA metadata, theme + locale providers
│   │   ├── page.tsx              → redirect /home
│   │   ├── globals.css           THE design token system (250 lines)
│   │   ├── manifest.ts           PWA manifest
│   │   ├── (auth)/               login, signup, auth/callback
│   │   ├── (app)/                Authenticated shell + 5 sections + secondary
│   │   └── api/                  27 route handlers
│   ├── components/
│   │   ├── ui/                   24 shadcn/Base UI primitives
│   │   ├── patterns/             10 mandated composed blocks (Screen, AmountText…)
│   │   ├── charts/               Recharts theming + card wrapper
│   │   ├── capture/              The single movement form + FAB
│   │   ├── layout/               Sidebar, topbar, tab bar, profile sheet, ⌘K
│   │   ├── home|budget|budgets|movements|wealth|insights/   feature modules
│   │   └── onboarding|review|import|settings|auth|shared|wisdom/
│   ├── hooks/                    18 React Query hooks, one per domain
│   ├── lib/
│   │   ├── supabase/             8 modules: client factories, ledger context, env
│   │   ├── query/                Query client, keys, fetchers, authorized fetch
│   │   ├── import/ + ledger/     Bank import pipeline (parse, categorize, dedupe)
│   │   ├── budgeting/ onboarding/ loans/ insights/ capture/
│   │   └── *.ts                  budgeting, giving, balance-checkpoint, investments…
│   ├── providers/                5 contexts: theme, locale, currency, month, query
│   └── types/database.ts         1,194 lines of Supabase table types
├── supabase/
│   ├── migration.sql             Base schema (984 lines)
│   ├── migrations/               15 dated migrations
│   └── imports/                  Generated one-off data-import SQL (gitignored here)
├── scripts/                      9 ops scripts (6 Node, 3 Python)
├── docs/                         APP.md (product handbook), handoff, runbook
├── changes/                      ~100 per-change implementation notes
├── design.md                     Design system source of truth
├── AGENTS.md / CLAUDE.md         Agent guardrails
└── Architecture/                 ← this report
```

### Directory conventions

- **`src/lib/` is framework-agnostic.** Modules there are pure functions and
  typed helpers; they import from `@/types/database` and each other, never from
  React. This is what makes the domain logic testable (`balance-checkpoint.test.ts`)
  and portable (the same normalizers exist in Python).
- **`src/hooks/` is the only place React Query is called.** Components consume
  hooks; they never construct query keys or call `authorizedFetch` directly.
- **`src/components/patterns/` outranks `src/components/ui/`.** Primitives are
  raw material; patterns are the sanctioned vocabulary. `design.md` explicitly
  instructs contributors to reach for a pattern before writing new markup.
- **Route groups carry no URL segment.** `(auth)` and `(app)` exist purely to
  give the two shells different layouts.

---

## 1.6 Naming and code conventions

| Convention | Rule | Example |
|---|---|---|
| Files | kebab-case everywhere | `capture-sheet.tsx`, `balance-checkpoint.ts` |
| Components | PascalCase export, kebab-case file | `CaptureSheet` in `capture-sheet.tsx` |
| Hooks | `use-` prefix, one domain per file | `use-monthly-summary.ts` |
| Query keys | Only from `lib/query/keys.ts` | `queryKeys.monthlySummary(m, y, asOf)` |
| Imports | `@/` alias, never deep relative paths | `@/lib/supabase/server` |
| Database types | Always via `Database["public"]["Tables"][…]` | `type ExpenseRow = …["expenses"]["Row"]` |
| Bilingual strings | `t("English", "Español")` inline, no keys | `t("Home", "Inicio")` |
| Category names | `tc(name)` — translated via alias index | `tc("Tithe / Diezmo")` → "Diezmo" |
| Money rendering | `<AmountText>` only, never raw numbers | `<AmountText amount currency signed />` |

The bilingual approach is unusual and worth calling out: **there is no message
catalog**. Both languages are written inline at every call site as two arguments
to `t()`. This keeps translations physically adjacent to the code that uses them
and makes drift impossible, at the cost of making a third language a substantial
refactor. For a two-language personal product, it is a reasonable trade — see
[10 — Architectural Decisions](10-architectural-decisions.md#ad-7-inline-bilingual-strings-instead-of-an-i18n-framework).

---

[← Index](README.md) · [Next: Layered Architecture →](02-layered-architecture.md)
