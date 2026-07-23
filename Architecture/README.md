# Budget & Expense — Architecture Report

A complete, granular architecture reference for the Budget & Expense application,
written for an architect who has never seen the codebase and needs to understand
how every part works and why it is built that way.

**Analyzed commit:** `7eec8f0` (2026-07-22) · **Files analyzed:** 278 · **Branch:** `main`

---

## What this application is

A bilingual (English/Spanish) personal **stewardship** application: a private
ledger for tracking expenses and income, planning a monthly budget with
envelope-style objectives, giving a share of income away first, tracking wealth
(investments, savings, debts, money lent to people), and reviewing spending
patterns over time.

It is a **single-tenant-per-user, mobile-first PWA** built on Next.js 16 (App
Router) with Supabase Postgres as the sole data store, deployed on Vercel. It is
in active production use by its author with real, reconciled bank data
(2,158 expenses and 208 income entries covering 2024-08 → present as of the last
reconciliation).

**Production:** `https://budget-expense-seven.vercel.app`

---

## How to read this report

The documents are ordered so each builds on the previous. If you are onboarding,
read 01 → 02 → 03 first; that gives you the shape of the system. The rest can be
read on demand.

| # | Document | What it covers |
|---|---|---|
| 01 | [System Overview](01-system-overview.md) | Product shape, technology stack, deployment topology, the end-to-end request lifecycle, and the repository map |
| 02 | [Layered Architecture](02-layered-architecture.md) | The twelve architectural layers, what belongs in each, dependency direction, and the module boundaries |
| 03 | [Data Model](03-data-model.md) | All 25 Postgres tables by domain, relationships, RLS model, triggers, aggregate RPCs, and the migration history |
| 04 | [API Surface](04-api-surface.md) | Every one of the 28 route handlers: methods, contracts, auth, validation, and behavior |
| 05 | [Frontend Architecture](05-frontend-architecture.md) | App Router structure, the provider tree, component taxonomy, the design-token system, and mobile/responsive strategy |
| 06 | [Domain Logic](06-domain-logic.md) | The business rules: budget pool math, envelope alerts, income-based giving, balance checkpoints, loans, onboarding personalization, investments |
| 07 | [Import Pipeline](07-import-pipeline.md) | Bank-statement ingestion, the two-path architecture, deduplication identity, and the load-bearing parity contract |
| 08 | [Cross-Cutting Concerns](08-cross-cutting-concerns.md) | Authentication, internationalization, multi-currency, state & caching, error handling, performance |
| 09 | [Operations](09-operations.md) | Infrastructure, environment variables, the migration workflow, known operational hazards, testing and gates |
| 10 | [Architectural Decisions & Assessment](10-architectural-decisions.md) | Why the system looks like this, the historical decisions still visible in the code, and a candid risk assessment |

---

## The ten things that matter most

If you only remember ten facts about this architecture, make them these.

1. **One Supabase project, but the code still speaks two.** The app originally
   bridged an auth project and a separate "ledger" project. The ledger project
   was deleted in July 2026 after a free-tier pause, and everything was
   consolidated. The bridging code pattern — `ledgerSupabase ?? appSupabase`
   with a user resolved *by email* — survives in every data route. See
   [08](08-cross-cutting-concerns.md#the-ledger-context-pattern) and
   [10](10-architectural-decisions.md).

2. **Server-side data access is service-role, not RLS.** Routes authenticate the
   user, then query with a service-role client scoped by an explicit
   `user_id` filter. RLS exists and is enabled on all 25 tables, but it is the
   *second* line of defense for API traffic, not the first.

3. **Money is never stored converted.** Every amount keeps its original
   currency. Conversion happens at render time through `CurrencyProvider.convert()`
   and the `AmountText` component. Change the base currency and nothing is
   rewritten — the whole UI simply re-derives.

4. **Interactive capture has one write path; reconciliation has a second.**
   User-entered movements go through `CaptureSheet` + `useCapture` (optimistic
   updates, Undo, envelope toasts, loan dual-writes). Balance reconciliation
   is the exception: `POST /api/balance-checkpoints` may also insert a surplus
   income or deficit expense with a standard bilingual name.

5. **One endpoint powers Home.** `GET /api/dashboard/summary` runs seven parallel
   queries plus a checkpoint lookup and returns raw, unconverted rows;
   `useMonthlySummary` derives ~20 metrics client-side. FX rate changes therefore
   never trigger a refetch.

6. **Giving is a share of income, structurally.** `resolveGivingTarget` takes plan
   income first, recorded income second, and never expenses. This is enforced in
   one function and documented as a product invariant.

7. **The import pipeline has a byte-level parity contract.** TypeScript
   normalizers in `src/lib/ledger/normalize.ts` must produce output identical to
   the Python importers in `scripts/`, because the two paths deduplicate against
   each other on the description field. Two npm-scripted parity gates enforce it.

8. **Balance is reconciled, not computed from zero.** Users record real bank
   balances as checkpoints; the app replays only movements dated after the
   checkpoint (with a `created_at` tiebreak and integer-cent arithmetic). A
   non-zero reconciliation delta is stored on the checkpoint *and* booked as
   a dated surplus/deficit movement so it appears in the ledger.

9. **The design system is enforced by grep, not convention.** `design.md` defines
   five gates banning raw status colors, magic values, stale routes, ad-hoc nav
   lists, and language switchers in headers. Tokens live in `globals.css` and are
   the only sanctioned source of color, type, radius, and elevation.

10. **Old routes never die.** Eight legacy routes are permanent redirect stubs
    because installed PWAs may deep-link to them. Deleting one breaks somebody's
    home-screen icon.

---

## Scale at a glance

| Dimension | Count |
|---|---|
| Files analyzed | 278 (249 code, 16 data, 7 docs, 5 config, 1 markup) |
| TypeScript / TSX source files | 238 |
| App Router pages | 31 (23 real, 8 permanent redirect stubs) |
| API route handlers | 28 (27 under `/api` + auth callback) |
| React components | 98 (23 primitives, 9 patterns, 2 chart, 64 feature/chrome) |
| React Query hooks | 18 |
| Global providers | 5 |
| Domain logic modules | 35 |
| Postgres tables | 25 (all RLS-enabled) |
| Postgres functions | 6 (3 triggers, 3 aggregate RPCs) |
| SQL migrations | 15 dated + 1 base schema |
| Operational scripts | 9 (6 Node, 3 Python) |
| Supported currencies | 20 (EUR default) |
| Supported UI locales | 2 (EN, ES) |

---

## Companion artifacts

- **Machine-readable graph:** `.understand-anything/knowledge-graph.json` —
  363 nodes and 1,105 edges across 12 layers, with a 14-step guided tour.
  Explore it with `/understand-dashboard`.
- **Project's own docs:** [`docs/APP.md`](../docs/APP.md) is the product
  handbook, [`design.md`](../design.md) is the visual system of record, and
  [`changes/`](../changes/) holds ~100 per-change implementation notes. This
  report describes the *architecture*; those describe the *product* and its
  *history*.

---

*Generated 2026-07-22 from direct source analysis at commit `7eec8f0`.*
