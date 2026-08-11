# 10 — Architectural Decisions & Assessment

[← Operations](09-operations.md) · [Index](README.md)

---

This document records the decisions that shaped the system — including the ones
made under duress — and offers a candid assessment of where the architecture is
strong and where it carries risk.

---

## Part I — Architectural decisions

### AD-1 — The ledger bridge and its ghost

**Context.** The app originally ran on two Supabase projects: a public/auth
project (`awpygbfocmynxpadpsji`) and a separate "ledger" project
(`bahkswifojxcnesfcqbs`) holding imported bank data. The same person had two
different user IDs, so server code authenticated against the auth project and then
resolved the user *by email* in the ledger project using a service-role client.

**What happened.** The ledger project sat on the free tier, auto-paused after
inactivity, and was deleted — NXDOMAIN, unrecoverable. On 2026-07-04 everything
was consolidated onto the single surviving project and expense history was
restored from git-tracked SQL plus fresh bank exports.

**What remains.** The bridging pattern is still in every data route:

```ts
const supabase = ledgerSupabase ?? appSupabase;
const effectiveUserId = ledgerUser?.id ?? user.id;
```

It now resolves a user to themselves in the same database. Also surviving: the
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` variable pair, the `--project ledger`
flag in `apply-sql.mjs`, "Apply to BOTH projects" headers in migrations, and
comments in `/api/dashboard/summary` describing which data "lives in the ledger
project".

**Assessment.** Leaving the pattern in place was the right call in the moment —
ripping out working auth plumbing during a data-recovery incident would have been
reckless. But the ghost now imposes a real cost: it is the reason API routes bypass
RLS, the reason there are two data-access paths, and the reason a `listUsers` scan
sits in the hot path of every request. It is the single largest piece of
architectural debt in the system, and it is well documented, which makes it
tractable.

---

### AD-2 — Store original currency, convert at render

**Decision.** Amounts persist with their own currency. Conversion happens in
`CurrencyProvider.convert()` at render time.

**Consequences.** Changing the base currency rewrites nothing and refetches
nothing — the same fetched rows re-render through a new rate. Historical amounts
stay faithful to what was actually paid. FX rate improvements apply retroactively
to all displays.

The cost is that no total can be computed in SQL. Every aggregate must be summed
client-side after conversion, which is precisely why `/api/dashboard/summary`
returns raw rows and `useMonthlySummary` does the arithmetic in a `useMemo`.

**Assessment.** Correct for a multi-currency personal ledger with a few thousand
rows. It would not scale to a reporting product needing server-side aggregation,
but that is not this product.

---

### AD-3 — One aggregation contract for Home

**Decision.** Home consumes one `MonthSnapshot` contract. The primary producer is
the RLS-protected `prepare_month_snapshot` RPC; the older
`GET /api/dashboard/summary` fan-out remains a compatibility source that
`getMonthSnapshot` adapts into the same shape.

**Consequences.** Home makes one aggregate request rather than a request per
domain. FX and base-currency changes remain client-side. The primary RPC also
materializes recurring rows atomically. The cost is a broad contract spanning
ledger, budget, recurrence, and checkpoint concerns, plus two producers that
must stay behaviorally compatible during the fallback window.

**Assessment.** A justified trade for a mobile app where request count dominates
perceived latency. New consumers should depend on `MonthSnapshot`, not on either
producer's raw shape.

---

### AD-4 — Pure domain logic with injected conversion

**Decision.** `src/lib/` modules import no React. Money-aware functions receive
`convert` as a parameter.

**Assessment.** This is the best structural decision in the codebase. It makes
balance checkpoints, Home carryover, recurring dates, and net worth testable with
Node's built-in runner and no mocking; it also let the normalizers be ported to
Python and held in parity. Currency — an inherently stateful, network-dependent
concern — stays out of pure arithmetic. This boundary should be defended in
review.

---

### AD-5 — One write path for movements

**Decision.** `CaptureSheet` + `useCapture` is the only way to create or edit an
expense or income.

**Consequences.** Optimistic updates, Undo, currency defaults, envelope alerts,
and loan dual-writes are implemented once. Same-month invalidation is centralized.
The checkpoint projection's wider dependency means historical edits still need a
future `monthSnapshotAll` invalidation hardening pass.

The rules around it are unusually precise, recorded in `docs/APP.md` §4: await save
before close; keep the sheet mounted while open; seed currency only on the open
edge; snapshot currency into the payload before awaits. Each encodes a bug that was
actually hit — the currency-seeding rule exists because a late-loading
`baseCurrency` was wiping a user's COP selection back to EUR.

**Assessment.** Strong. The discipline shows.

---

### AD-6 — Enforce the design system by grep

**Decision.** Five grep rules in `design.md` §7 run before merging UI work: no raw
status colors, no magic values outside `components/ui/`, no stale route strings, no
ad-hoc nav lists, no language switchers in headers.

**Assessment.** Crude but effective, and better than an unenforced style guide. The
token coverage (~120 custom properties across both themes) is thorough enough that
components rarely need an exception. The obvious upgrade is moving these greps into
ESLint rules or a CI step so they run automatically rather than from memory.

---

### AD-7 — Inline bilingual strings instead of an i18n framework

**Decision.** `t("English", "Español")` at every call site. No catalog, no keys,
no extraction.

**Assessment.** For exactly two languages and one author, this is the right trade.
Translations cannot drift from usage because they are physically adjacent to it,
and there is no build step or key-namespace discipline to maintain. A third
language would require touching every call site — but that is a real cost only if
a third language is actually planned.

---

### AD-8 — Reconciliation delta: audited on the checkpoint, booked on the ledger

**Original decision (2026-07-18).** Balance checkpoints store the difference
between real and calculated balance as `reconciliation_delta`, enforced by a
table CHECK and a `BEFORE INSERT` trigger, and originally **never** booked it
as a transaction. The column comment still reads *"Audit-only … never ledger
income"* — that comment is now historically accurate for the *checkpoint row*,
not for product behavior.

**Revised decision (2026-07-24).** Keep the checkpoint audit fields and hard
consistency checks, **and** book a non-zero delta as an explicit ledger
movement (income for surplus, expense for deficit) with standard bilingual
names and `as_of_date`. Insert the movement before the checkpoint so
same-day ordering does not double-count tracked available cash.

**Assessment.** The hard rejection of inconsistent checkpoint math stays
correct — financial reconciliation must not silently degrade. Booking the
delta as a named movement makes the surplus/deficit visible in Movements and
monthly reports without treating the checkpoint balance itself as income.
See [06 §6.4](06-domain-logic.md#reconciliation-delta-is-audited-and-booked) and
`changes/2026-07-24-balance-adjustment-movements.md`.

---

### AD-9 — Permanent redirect stubs

**Decision.** Eight legacy routes remain forever as six-line `redirect()` files.

**Assessment.** Correct for an installable PWA. A user who added `/dashboard` to
their home screen in April must still land somewhere sensible. The cost is eight
trivial files; the benefit is never breaking a saved shortcut.

---

### AD-10 — Manual migrations, defensive code

**Decision.** No migration runner. SQL is applied by hand through the Management
API, decoupled from deploys. Code tolerates a lagging schema via
`postgrest-errors.ts`.

**Assessment.** The tolerance strategy is coherent and well-implemented — the
import proposer degrading to uncategorized rather than failing an upload is a good
example. But applied status lives in prose, and drift between documentation and
database is a real failure mode. A minimal `schema_migrations` table would remove
the ambiguity at near-zero cost.

---

### AD-11 — Carried cash and monthly plan are separate Home layers

**Context.** Home historically used `income − spent` for its largest number.
That is a valid monthly-plan remainder but resets at every month boundary, so it
discarded the prior month's real closing cash and understated what was actually
available.

**Decision.** When tracking is valid, Home's headline and daily guide use the
checkpoint-backed continuous balance. The Home meter and Budget hero remain
month-only plan views. If tracking is unavailable, Home falls back to the old
monthly figure instead of failing.

**Consequences.** One screen intentionally shows two related but non-identical
figures: carried cash as the headline, plan pace as supporting context. Copy must
identify which is which. No schema, rollover record, cron, or month-end mutation
is required because checkpoint replay naturally crosses the boundary.

**Assessment.** This is the correct separation of cash position from planning.
It also creates a cross-month cache dependency for historical edits, documented
as a hardening gap in the
[canonical carryover contract](../docs/balance-carryover.md).

---

## Part II — Assessment

### What this architecture does exceptionally well

**The domain core is genuinely pure and genuinely tested where it matters.**
Dependency injection of `convert` is not a pattern applied for its own sake; it is
what makes the money math independent of the network. Balance arithmetic, Home
carryover selection, net worth, recurring-date rules, and import parity all have
targeted automated verification. That targeting shows real engineering judgment.

**Single sources of truth are actually single.** Navigation, query keys, design
tokens, the movement write path, the giving calculation, the dedupe key. Each has
one home, and the codebase is disciplined about it. This is rarer than it sounds.

**The parity contract is exemplary engineering.** Recognizing that two
implementations in two languages must produce byte-identical output, documenting it
in capital letters at the top of the file, reimplementing Python's `str.capitalize`
and `strptime` pivot semantics precisely, and then building automated gates to
enforce it — that is a level of rigor most production teams would not reach for.

**Documentation is a first-class artifact.** The handbook, design system, runbooks,
and ~100 change notes make the system legible to a newcomer in a way most codebases
are not. Much of this report was reconstructible because the reasoning was written
down as it happened.

**Failure modes are thought through.** Fail-open proxy, degradation on missing
tables, unconverted amounts when rates are unavailable, alerts that show rather
than hide when storage is blocked. Each choice picks the direction that keeps the
user working.

---

### Risks, ordered by severity

#### Risk 1 — Two budget models coexist

`budgets` (per-category, the original model) and `custom_budgets` (envelopes, the
current model) are both live. `calculateBudgetPoolMetrics` reads `budgets` for
`assignedCategoryBudgetTotal` and `isOverAssigned`, while the UI presents
`custom_budgets` as "objectives".

**Impact.** Two ways to answer "what is my budget for groceries" that can
disagree. A change note (`2026-07-18-fix-budget-math-mismatch-and-method-clarity.md`)
suggests this has already produced confusion.

**Recommendation.** Choose one model. If envelopes win, migrate `budgets` rows into
single-category `custom_budgets` and delete the table and its code paths. This is
the highest-value simplification available.

#### Risk 2 — No CI and narrow test coverage

There are four pure-domain test files and no automated pipeline. Lint, build,
balance, Home carryover, wealth, recurrence, and import-parity gates all depend
on someone remembering to run them.

**Impact.** The parity gate — protecting against silent duplicate financial records
— can be bypassed by forgetting.

**Recommendation.** A GitHub Action running lint, build, all four domain suites,
and both parity checks on every push. This is a small change for a
disproportionate reduction in risk.

#### Risk 3 — The email-resolution scan

`resolveServiceRoleUserByEmail` calls `auth.admin.listUsers({ page: 1, perPage: 200 })`
and scans the result in memory, cached for five minutes.

**Impact.** Silently breaks past 200 users — the lookup returns `null`, the code
falls back to `user.id`, and if the IDs ever diverged the user would see an empty
ledger rather than an error. For a single-user app this is fine; it is a hard
ceiling on ever becoming multi-user.

**Recommendation.** Since there is now one project and one user identity, delete the
resolution entirely and use `user.id` directly. That single change removes the
scan, the cache, and a large share of the AD-1 debt.

#### Risk 4 — Two data-access paths with different authorization models

Expenses/incomes/imports/investments go through `/api` with service-role and
explicit filters; categories/budgets/plans/profile go direct from the browser under
RLS.

**Impact.** Two security models to reason about, two debugging paths, and a
standing hazard: a new API route that forgets `.eq("user_id", …)` leaks data despite
RLS being enabled everywhere.

**Recommendation.** Converge. With the ledger project gone, the API routes could use
the user's own RLS-scoped client and drop service-role entirely — making RLS the
single enforcement point.

#### Risk 5 — Free-tier data loss exposure

The pause hazard has already destroyed one project's data permanently.

**Recommendation.** A scheduled keep-alive (a Vercel Cron hitting a trivial
endpoint would do), automated backups, or a paid tier. The documentation
recommends this; nothing implements it.

#### Risk 6 — Oversized route handlers

`/api/investments` is 787 lines across six resources; `/api/dashboard/summary` is
458.

**Recommendation.** Split investments into `/api/investments/[resource]/route.ts`
using the existing Zod union per file. The summary route is defensible as-is given
AD-3, but its per-domain query blocks could move into `lib/` functions.

#### Risk 7 — Inconsistent page/component extraction

Most pages are 6–10 lines delegating to a screen component; five (`settings` 325,
`wealth/investments` 452, `insights/categories/[id]` 303, `wealth/savings` 181,
`import` 142) hold substantial logic inline.

**Recommendation.** Extract to `components/<section>/` for consistency. Low urgency,
low risk.

#### Risk 8 — Documented-but-unenforced conventions

The five design gates, the capture rules, and the editorial section rule are all
prose. They have been followed well, but nothing prevents violation.

**Recommendation.** Promote the mechanically checkable ones (raw colors, magic
values, nav imports) into ESLint rules.

---

### Recommended sequence

If the goal were to reduce risk with the least disruption, this order maximizes
value per unit of effort:

1. **Add CI** running lint, build, all domain tests, and `check:parity`. *(Removes Risk 2.)*
2. **Add a Supabase keep-alive.** *(~30 min, removes Risk 5.)*
3. **Delete email resolution and service-role usage**, using the authenticated
   user's client directly. *(Removes Risk 3, most of Risk 4, and the bulk of AD-1.)*
4. **Consolidate the two budget models.** *(Largest conceptual simplification, Risk 1.)*
5. **Split `/api/investments`.** *(Risk 6.)*
6. **Promote design gates to ESLint.** *(Risk 8.)*
7. **Extract the five heavy pages.** *(Risk 7.)*

---

### Closing assessment

This is a **well-architected application** — notably so for a single-author
personal project. The layering is real rather than nominal, the domain core is
pure and injectable, single sources of truth are respected, and core money,
date, and import-identity rules have both explicit reasoning and automated
verification.

Its weaknesses are almost entirely **the scars of a production incident** rather
than design failures: the ledger-bridge ghost, the dual data paths, and the vestigial
environment variables all trace to the two-project era and its abrupt end. They are
well documented, well understood, and — now that there is one database — largely
removable in a single focused refactor.

The most striking quality is the **written reasoning**. Comments explain not just
what code does but why alternatives were rejected: why HTTP caching was removed,
why `created_at` must be server-generated, why currency seeds only on the open
edge, why plan income beats recorded income. That habit is what made this
architecture report possible to write with confidence, and it is worth more to the
project's long-term health than any single structural choice in it.

---

[← Operations](09-operations.md) · [Index](README.md)
