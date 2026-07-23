# 02 — Layered Architecture

[← System Overview](01-system-overview.md) · [Index](README.md) · [Next: Data Model →](03-data-model.md)

---

## 2.1 The twelve layers

Every one of the 278 analyzed files belongs to exactly one layer. The layers are
derived from actual import topology, not from folder names alone.

```
┌─────────────────────────────────────────────────────────────────────┐
│  DOCUMENTATION (7)                                                  │
│  docs/APP.md · design.md · handoff · runbook · README · AGENTS      │
│  Contracts the code must honor. Referenced by, never imported.      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  APP ROUTER PAGES & LAYOUTS (37)                                    │
│  Root/auth/app layouts · 23 pages · 8 redirect stubs · manifest     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ renders
┌───────────────────────────────▼─────────────────────────────────────┐
│  FEATURE COMPONENTS & CHROME (56)                                   │
│  home/ budget/ movements/ wealth/ insights/ capture/ onboarding/    │
│  review/ import/ settings/ auth/ wisdom/ + layout chrome            │
└───────────────────────────────┬─────────────────────────────────────┘
                     ┌──────────┴──────────┐
                     │ composes            │ consumes
┌────────────────────▼──────────┐  ┌───────▼─────────────────────────┐
│  DESIGN SYSTEM (43)           │  │  STATE, HOOKS & PROVIDERS (23)  │
│  globals.css tokens           │  │  18 React Query hooks           │
│  ui/ primitives (23)          │  │  5 providers (month, currency,  │
│  patterns/ (9) · charts/      │  │  locale, theme, query)          │
│  shared/                      │  └───────┬─────────────────────────┘
└───────────────────────────────┘          │ calls
                                ┌──────────┴──────────┐
                                │                     │
┌───────────────────────────────▼──────┐  ┌───────────▼─────────────────┐
│  DOMAIN LOGIC (35)                   │  │  DATA ACCESS & QUERY (13)   │
│  budgeting · giving · balance-       │  │  supabase/ client factories │
│  checkpoint · import/ · ledger/ ·    │  │  ledger context · query/    │
│  loans/ · onboarding/ · investments  │  │  keys, fetchers, types      │
│  Pure functions. No React. Testable. │  └───────────┬─────────────────┘
└───────────────────────────────┬──────┘              │
                                └──────────┬──────────┘
                                           │ HTTP
┌──────────────────────────────────────────▼──────────────────────────┐
│  API ROUTES (28)                                                    │
│  27 /api handlers + auth callback. Zod-validated, bearer-authed.    │
└──────────────────────────────────────────┬──────────────────────────┘
                                           │ guarded by
┌──────────────────────────────────────────▼──────────────────────────┐
│  EDGE & AUTH GATE (2)                                               │
│  proxy.ts · lib/supabase/middleware.ts                              │
└──────────────────────────────────────────┬──────────────────────────┘
                                           │ SQL
┌──────────────────────────────────────────▼──────────────────────────┐
│  DATABASE SCHEMA (16)                                               │
│  migration.sql + 15 dated migrations · 25 RLS tables · 6 functions  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────────────┐
│  OPS & IMPORT SCRIPTS (9)│  │  PROJECT CONFIGURATION (9)           │
│  apply-sql · Python      │  │  package.json · tsconfig · eslint    │
│  importers · parity gates│  │  postcss · components.json           │
└──────────────────────────┘  └──────────────────────────────────────┘
```

| Layer | Files | Entry points |
|---|---|---|
| Documentation | 7 | `docs/APP.md`, `design.md` |
| App Router Pages & Layouts | 37 | `app/layout.tsx`, `app/(app)/layout.tsx` |
| Feature Components & Chrome | 56 | `home-screen.tsx`, `capture-sheet.tsx` |
| Design System & Primitives | 43 | `globals.css`, `patterns/screen.tsx` |
| State, Hooks & Providers | 23 | `use-monthly-summary.ts`, `currency-provider.tsx` |
| Domain Logic | 35 | `budgeting.ts`, `giving.ts`, `import/propose.ts` |
| Data Access & Query Core | 13 | `supabase/request.ts`, `query/keys.ts` |
| API Routes | 28 | `api/dashboard/summary/route.ts` |
| Edge & Auth Gate | 2 | `proxy.ts` |
| Database Schema | 16 | `supabase/migration.sql` |
| Ops & Import Scripts | 9 | `scripts/apply-sql.mjs` |
| Project Configuration | 9 | `package.json` |

---

## 2.2 Dependency rules

The architecture holds four rules. Three are enforced mechanically; one is
convention.

### Rule 1 — Domain logic imports nothing from React *(enforced by TypeScript)*

Every module in `src/lib/` outside `lib/query/` and `lib/supabase/` is a pure
function library. `budgeting.ts`, `giving.ts`, `balance-checkpoint.ts`,
`ledger/normalize.ts`, `ledger/dedupe.ts`, `insights/anomalies.ts`,
`onboarding/personalize.ts`, and `import/*` import only:

- TypeScript types from `@/types/database`
- each other
- occasionally `date-fns`

This is why `balance-checkpoint.ts` has a plain Node test suite
(`npm run test:balance`) with no test framework, no JSDOM, and no mocking, and why
the normalizers could be ported to Python and kept in parity.

Dependency injection is done by **passing `convert` as a parameter** rather than
importing the currency context:

```ts
// src/lib/budgeting.ts
export function calculateBudgetPoolMetrics({
  plan, budgets, expenses,
  convert,                                  // ← injected, not imported
}: BudgetPoolMetricsArgs): BudgetPoolMetrics
```

Every money-aware domain function follows this signature convention. It is the
single most important structural decision in the codebase: it keeps currency
conversion (an inherently stateful, network-dependent concern) out of the pure
math.

### Rule 2 — Components never touch the network directly *(convention, well kept)*

The chain is always:

```
Component → hook (src/hooks) → fetcher (lib/query/fetchers) → authorizedFetch → /api
```

Components do not construct query keys, call `fetch`, or import `authorizedFetch`.
Two sanctioned exceptions exist, both reading the browser Supabase client
directly for auth-adjacent work: `CurrencyProvider` (reads `profiles.base_currency`)
and the auth forms (`login-form.tsx`, `signup-form.tsx`).

### Rule 3 — Navigation comes only from `lib/navigation.ts` *(enforced by grep gate)*

`PRIMARY_NAV` and `SECONDARY_NAV` are consumed by the sidebar, tab bar, profile
sheet, and command menu. `design.md` §7 gate 4 makes an ad-hoc nav list a merge
blocker. The payoff is that adding a section is a one-file change that
automatically appears on four surfaces with correct bilingual labels, icons, and
active-state matching.

### Rule 4 — Design tokens only *(enforced by grep gates)*

`design.md` §7 defines five greps run before merging UI work:

1. No raw status colors in `src/` (`emerald-|rose-\d|amber-\d|red-\d|sky-\d|blue-\d|#10b981`)
2. No magic values outside `components/ui/` (`rounded-[…rem]`, `text-[…rem]`, `tracking-[…]`, `shadow-[0_…]`)
3. No stale route strings outside redirect stubs
4. Nav items only from `lib/navigation.ts`
5. No language switcher in `Screen` headers

The single sanctioned exception is **per-category color**, which is user data
stored in the database and applied via inline `style` through `CategoryBadge`.

---

## 2.3 Module boundaries in detail

### `lib/supabase/` — four clients, four jobs

This is the most subtle module in the codebase. There are four distinct Supabase
client constructions, and choosing the wrong one is a security or correctness bug.

| Module | Client | Used by | Auth basis |
|---|---|---|---|
| `client.ts` | `createBrowserClient` | Browser components/providers | User session cookie |
| `server.ts` | `createServerClient` + `cookies()` | RSC, route handlers | User session cookie |
| `request.ts` | Bearer-verified or cookie fallback | **All API routes** | `Authorization: Bearer` first |
| `service-role.ts` | `createClient` + service key | API routes, after auth | **Bypasses RLS entirely** |

`request.ts` deserves attention. API routes are called from the client with an
explicit Bearer token (`authorizedFetch` attaches it), *and* with cookies
(`credentials: "include"`). `createRequestClient` prefers the token:

```ts
const token = getBearerToken(request);
if (token) {
  const bearerClient = await createBearerClient(token);  // verifies via getUser(token)
  if (bearerClient) return bearerClient;
}
const supabase = await createServerClient();             // cookie fallback
```

The dual path exists because cookie propagation is fragile across the
client → route-handler boundary in some deployment conditions; the Bearer token is
the reliable channel, with cookies as the safety net.

`service-role.ts` is server-only (enforced by `import "server-only"`), memoizes a
singleton client keyed on the env snapshot, and caches email→user lookups for five
minutes. The lookup itself is `auth.admin.listUsers({ page: 1, perPage: 200 })`
scanned in memory — a known scalability limit discussed in
[10 — Assessment](10-architectural-decisions.md#risk-3-the-email-resolution-scan).

### `lib/query/` — the caching contract

Four files define how all server state behaves:

- **`client.ts`** — `staleTime: 60s`, `gcTime: 10min`, `retry: 1`,
  `refetchOnWindowFocus: false`. The comment records a deliberate reversal: HTTP
  caching on transactional GETs was *removed* so the React Query cache is the
  single source of freshness. Browser-cached responses were defeating invalidation
  after mutations.
- **`keys.ts`** — the key factory. Every cached domain builds keys here.
  `expenses` keys are `["expenses", year, month, categoryId, search]`, which
  allows prefix invalidation via `expensesAll = ["expenses"]`.
- **`fetchers.ts`** — typed fetch functions and the raw payload types.
- **`authorized-fetch.ts`** — Bearer attachment, `Content-Type` when a body is
  present, throw on non-2xx.

The prefix-invalidation design is what makes the write path simple: `useCapture`
invalidates `expensesAll` and `monthlySummaryAll` and every month, filter, and
search variant refetches correctly.

### `lib/import/` and `lib/ledger/` — a two-package pipeline

`ledger/` holds the primitives that must stay in parity with Python
(`normalize.ts`, `categorize.ts`, `dedupe.ts`). `import/` holds the pipeline
built on them (`csv.ts`, `parse-santander.ts`, `parse-wise.ts`, `tithe-match.ts`,
`propose.ts`, `types.ts`). The split is meaningful: `ledger/` is a *contract*
shared with an external implementation; `import/` is application code free to
change. See [07 — Import Pipeline](07-import-pipeline.md).

---

## 2.4 What the layering gets right

**The pure-domain core is genuinely pure.** Many codebases claim a domain layer
and then leak framework imports into it. Here the boundary is real, verified by
the fact that domain modules take `convert` as an argument rather than reaching
for context. This is the property that makes the balance-checkpoint math unit
testable with zero infrastructure.

**One write path, centrally invalidated.** Because `useCapture` is the only
movement writer and `queryKeys` is the only key source, cache coherence is a
solved problem rather than a recurring bug class.

**The design system has teeth.** Enforcement by grep is crude, but it is real
enforcement, and the token coverage (`globals.css` defines ~120 custom properties
across both themes) means components rarely need to reach outside it.

## 2.5 Where the layering strains

**`app/api/investments/route.ts` is 787 lines** handling six resources through a
Zod discriminated union and three parallel `switch` statements (create, update,
delete). It is the single largest file in the codebase and the clearest candidate
for decomposition into `/api/investments/[resource]/route.ts`.

**`app/api/dashboard/summary/route.ts` is 458 lines** and knows about expenses,
incomes, budgets, plans, investment transfers, and balance checkpoints. Its size
is a direct consequence of the "one request for Home" performance decision, so
the complexity is bought deliberately — but it does mean Home's correctness
depends on one large function.

**The ledger-context pattern is duplicated rather than reused.** `lib/supabase/ledger.ts`
exports `resolveLedgerContext` and `lib/loans/ledger.ts` exports
`resolveLedgerWriteClient` — but several routes (`expenses`, `dashboard/summary`)
still inline the same four lines of service-role resolution. The abstraction
exists; adoption is incomplete.

---

[← System Overview](01-system-overview.md) · [Index](README.md) · [Next: Data Model →](03-data-model.md)
