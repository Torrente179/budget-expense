# Performance Recovery and Rebuild Plan

Status: authoritative architecture and rollout record

Decision date: 2026-07-22

Last implementation update: 2026-07-23

## Decision

Optimize the current Next.js application first. React/Vite/TypeScript,
Supabase, and a small Go integration service remain the greenfield target, not
the current implementation.

The measured delays came from data, authentication, rendering, and bundle
architecture that a frontend rewrite would initially inherit. The current app
can provide a static, SPA-like shell and direct RLS-protected Supabase access
without taking on a high-risk rewrite or database fork.

## Evidence and audit scope

The requested Understand Anything knowledge graph was absent during the
original audit. A graph later appeared with an analysis timestamp and commit
from before this recovery; it was used as a historical cross-check, not as the
source of truth for the changed code. Findings and validation therefore came
from direct source inspection, production build artifacts, live timing probes,
environment/region checks, and official Next.js, Vercel, and Supabase
documentation.

Production observations are a baseline, not a statistically valid p75/p95:

| Observation | Baseline before recovery |
|---|---:|
| First browser root-to-login observation | about 10.3 s |
| Warm browser reload | about 263 ms |
| Login curl TTFB | about 0.30–0.38 s |
| Unauthenticated API observations | about 0.29–1.34 s |
| Production route classification | all app pages dynamic |
| Shared client JavaScript | about 364 KiB gzip |
| Home client JavaScript | about 481 KiB gzip |
| Budget client JavaScript | about 511 KiB gzip |
| Insights client JavaScript | about 537 KiB gzip |
| Investments client JavaScript | about 495 KiB gzip |

Final local production-build inventory after recovery:

| Route graph | Current eager JavaScript |
|---|---:|
| Shared app shell | 191.9 KiB gzip |
| Home | 207.4 KiB gzip |
| Budget | 209.3 KiB gzip |
| Insights shell + immediately requested screen | 211.5 KiB gzip |
| Investments | 206.9 KiB gzip |
| Movements | 219.8 KiB gzip |
| Savings | 207.3 KiB gzip |

All eligible application pages are now prerendered static. APIs, the auth
callback, and parameterized category routes remain dynamic by design.

One cold observation is not a production percentile. Supabase free-tier
wake-up remains a hypothesis until telemetry separates database wake time from
function, network, authentication, and query time.

## Proven causes

1. The root layout called `headers()`, forcing every app page to render at
   request time. Most destinations had no loading boundary, so navigation
   waited for a server-rendered RSC response.
2. Vercel functions executed in `iad1` while the Supabase project is in
   Ireland. Vercel recommends placing compute close to the data source and
   supports region selection in `vercel.json`.
   [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
3. A single API action could verify auth in the proxy, verify it again in the
   handler, then call `admin.listUsers` to translate an email through a retired
   two-project bridge.
4. The live Supabase project publishes ES256 keys. `auth.getClaims()` can
   validate with cached JWKS instead of calling Auth for every verification.
   [Supabase getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims)
5. Dashboard summary fanned out across many queries, then performed three
   paginated historical row scans and transferred raw rows for browser-side
   aggregation.
6. Home independently requested profile, onboarding, giving target, review
   count, plan, custom budgets, expenses, recurring data, household data, and
   adjacent months. Attention Feed repeated several of these reads.
7. Recurring synchronization invalidated every expense and summary query even
   when it inserted zero rows.
8. Capture, cmdk, profile sheets, Base UI tooltip/floating code, Recharts,
   Framer Motion, desktop and mobile navigation surfaces, and route forms were
   represented in initial client graphs more often than necessary.
9. Wealth repeatedly downloaded a seven-table snapshot; market quote batching
   still performed per-symbol metadata/cache work and unbounded provider
   concurrency; household insights performed sequential/fallback waves.
10. Existing month indexes were already present. Missing indexes were not the
    primary bottleneck, so new indexes require `EXPLAIN (ANALYZE, BUFFERS)`.

## Correct foundations retained

- Next `<Link>` navigation and production prefetch behavior
- The singleton TanStack Query client
- Movements virtualization
- Optimistic capture and Undo behavior
- Existing Tailwind/design tokens and visible product behavior
- Supabase PostgreSQL as the source of truth and Supabase RLS
- Existing URLs and route semantics

## Recovery implementation

### Region, shell, and authentication

- `vercel.json` pins Vercel compute to `dub1`.
- Root rendering defaults to English and no longer reads request headers.
  Stored/browser locale is resolved after hydration.
- `(app)/loading.tsx` supplies a shared navigation fallback, and primary links
  show pending feedback through `useLinkStatus`.
- `/api/**` is excluded from the proxy matcher.
- Proxy and route authentication use `getClaims()` and derive identity from
  verified JWT claims.
- Protected compatibility handlers authenticate before parsing request input,
  so unauthenticated requests consistently return `401` and perform one
  verification per handler execution.
- User-facing data paths use the authenticated RLS client. The old bridge is
  off by default and exists for one rollback window behind
  `ENABLE_LEGACY_LEDGER_BRIDGE=true`; ordinary traffic never calls
  `admin.listUsers`.

### Stable data contracts

`src/lib/data` is the framework-neutral boundary used by components and hooks.
It exposes typed `AppBootstrap`, `MonthSnapshot`, and household contracts.

The additive migration
`supabase/migrations/20260723000000_performance_data_contracts.sql` adds:

- `get_app_bootstrap()` for identity, profile/currency/onboarding/giving data,
  and review count.
- `prepare_month_snapshot(year, month, as_of)` to materialize missing recurring
  entries with `ON CONFLICT DO NOTHING` and return compact currency totals,
  balance state, recent movements, daily/category aggregates, budgets, plan,
  recurring rules, and `recurringInsertedCount`.
- `get_household_insights()` for one trailing-household aggregate call.
- Transactional bulk copy/seed RPCs for category and custom budgets.
- `create_expense_with_envelope_status(...)` inserts a manual expense and
  returns the affected envelope context from the same transaction, eliminating
  three post-write reads.

All new functions are `SECURITY INVOKER`, use `auth.uid()`, set `search_path`,
and grant execution only to `authenticated`. Applying the migration does not
delete, truncate, migrate, or rewrite existing financial rows. It was applied
to the linked app Supabase project on 2026-07-23 after a one-migration dry run.

Existing API handlers remain compatibility adapters. The browser falls back
when RPCs are not deployed or when
`NEXT_PUBLIC_USE_LEGACY_DATA_API=true`. Remove compatibility only after one
stable release and parity evidence.

### Cache and request discipline

- Default query freshness is five minutes with 30-minute garbage collection.
- Bootstrap and categories are fresh for one hour; exchange rates one hour;
  market quotes 15 minutes.
- Query functions pass AbortSignals to Supabase/fetch.
- Monthly ledger search filters its already-loaded cache; it does not issue a
  leading-wildcard request per keystroke.
- The automatic 600 ms adjacent-month burst is removed. Month arrows prefetch
  only after pointer, focus, or touch intent.
- Home shares one bootstrap query and one month-snapshot query. Attention Feed
  consumes props/selectors from those caches rather than launching another
  request wave.
- Recurring insertion invalidates the selected month only when rows changed.
- Movement writes use direct RLS CRUD for ordinary expense/income operations,
  keep the loan transaction adapter, preserve optimistic UI, and do not hold
  buttons pending for broad aggregate refetches.
- Expense capture derives envelope alerts from the write result; compatibility
  paths retain the old read fallback only while the RPC is unavailable.

### Navigation and bundles

- Capture and movement edit sheets mount only after first open.
- Command Menu and Profile contents dynamically load only after interaction.
- Profile has one persistent host across app transitions and reuses bootstrap.
- The unused global Tooltip provider is removed.
- Shell `cn`, locale, and calendar helpers no longer import `date-fns` locales.
- The shared Recharts donut is an accessible lightweight SVG; Home no longer
  needs the Recharts runtime.
- Simple Budget, Investment, and Giving card entrance animations no longer
  require Framer Motion. Reduced-motion behavior remains globally honored.
- Budget and Investment/Savings forms are split behind their first click.
  Below-fold Insights charts load only when approaching the viewport and chart
  animation is disabled.
- Movements virtualization remains intact.

### Secondary paths

- Household insights use one direct RPC with legacy adapter fallback.
- Investments use a compact position/cash overview contract plus independent
  cached, 75-row pages for trades, cash movements, and savings movements;
  pages expose explicit Load More controls. Savings totals remain complete via
  grouped balance totals, independent of the visible page.
- Quote input is deduplicated, metadata and fresh quote cache rows are bulk
  read, and provider work is capped at five concurrent symbols.
- Exchange-rate responses send one-hour CDN caching with stale-while-revalidate.
- Budget seed/copy operations have transactional bulk RPCs and one-request
  fallbacks.

## Data safety and invariants

- Supabase remains the only source of truth; there is no database fork,
  dual-write system, destructive migration, or data copy in this recovery.
- Database deployment remains separate from application deployment. The
  additive contract migration is now applied; application traffic can use the
  RPCs after the repository release reaches production.
- `supabase/tests/performance-data-contracts.sql` runs in a transaction and
  rolls back. It checks representative month totals, recurring uniqueness,
  bootstrap identity, transactional expense return shape, and two-user RLS
  read/write isolation.
- Direct-user and legacy counts/totals must be compared for representative
  current, historical, recurring, multi-currency, checkpoint, and empty months
  before the bridge flag is removed.
- A read-only live probe checked four auth users and six representative months;
  identity resolution and per-currency counts/totals matched. No production
  rows were written. Full staging SQL/RLS tests are still required after the
  migration is applied there.

## Acceptance budgets

| Metric | Gate |
|---|---:|
| Click-to-feedback | <100 ms |
| Cached navigation | <200 ms |
| Warm primary-tab content | <300 ms p75 |
| Cold foreground data-ready, awake DB | <800 ms |
| API/RPC latency | <400 ms p95 |
| Month snapshot database time | <75 ms p95 |
| Long navigation task | none >50 ms |
| Shared shell JavaScript | <300 KiB gzip |
| Home JavaScript | <325 KiB gzip |
| Incremental route JavaScript | <100 KiB gzip |

Capture, Command Menu, Recharts, and Framer chunks must be absent until their
own feature is used. Production percentiles require post-deployment telemetry;
local builds cannot certify them.

Local validation completed on 2026-07-23:

- TypeScript passed and ESLint completed with zero errors (remaining warnings
  are compiler opt-outs for React Hook Form/TanStack Virtual plus two existing
  effect warnings and one script warning).
- Six checkpoint/balance tests passed.
- Normalization parity passed for 20 concepts, three functions, five amounts,
  and four dates; import parity passed for seven expenses, four incomes, three
  tithes, and one skipped row.
- The production build compiled and prerendered 52/52 generated pages; all
  eligible app destinations are static.
- Final warm local production smoke checks returned `/home` -> `/login` with
  307 in about 2 ms TTFB; protected Expenses, Incomes, Summary, and Investments
  GETs returned 401 in about 2–5 ms; `/login` returned 200 in about 4 ms.
- Supabase CLI dry-run selected only
  `20260723000000_performance_data_contracts.sql`; it was then applied to the
  linked app project. Remote migration history matches, public-schema lint has
  no errors, and read-only counts for all 25 app tables were identical before
  and after the migration. The transaction/rollback SQL suite remains intended
  for local/staging rather than production.

## Rollout

1. Documentation, migration SQL, tests, and the local production build are
   reviewed and validated.
2. The additive migration is applied to the linked app project; migration
   history, schema lint, and before/after row counts pass.
3. Push and deploy the static-shell/region/auth application release with
   compatibility adapters retained.
4. Measure `EXPLAIN (ANALYZE, BUFFERS)`, request count, and p75/p95 against
   live authenticated traffic, starting with a canary where available.
5. Keep legacy adapters for one stable release. Remove them only after parity,
   RLS, bundle, error-rate, and performance gates pass.

Each release phase receives a separate note in `changes/`.

## Rollback

- Set `NEXT_PUBLIC_USE_LEGACY_DATA_API=true` and redeploy to route browser reads
  through existing API adapters.
- Set `ENABLE_LEGACY_LEDGER_BRIDGE=true` only if the retired bridge is required
  during its one-release rollback window.
- Revert the application release while leaving additive SQL functions in
  place; old clients ignore them.
- Do not drop functions or bridge compatibility during an incident. Removal is
  a later reviewed migration after stability is proven.

## Future rebuild architecture

- Frontend: React 19, Vite, strict TypeScript, TanStack Router, TanStack Query,
  and current Tailwind/design tokens, deployed as static CDN assets.
- Core data: the same Supabase PostgreSQL/Auth project in `eu-west-1`, RLS,
  generated types, migrations, and the compact RPC contracts established here.
- Go boundary: only for bank/provider integrations, webhooks, imports,
  schedules, and market refreshes—not ordinary user CRUD.
- Default Go runtime: AWS Lambda/API Gateway in `eu-west-1`, EventBridge,
  SQS retries, Secrets Manager, idempotency keys, structured logs, and Supabase
  JWKS verification.
- Contracts: versioned OpenAPI for Go and generated TypeScript clients;
  Supabase RPCs remain shared typed domain contracts.

Strangler sequence:

1. Stabilize data contracts and tests in Next.js.
2. Move aggregation and transactional workflows into SQL/RPCs.
3. Build Vite screens against the same contracts and database.
4. Add Go integrations only when real provider/job requirements exist.
5. Canary routes/users, retain Next rollback for two releases, then switch the
   static frontend.

Start the rebuild only if optimized Next.js still misses the budgets,
offline-first becomes central, or multiple integrations/jobs justify a
dedicated service.
