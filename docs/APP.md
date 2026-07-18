# Budget & Expense — App documentation

Living product + engineering handbook for this repository. Visual tokens and UI
rules live in [`design.md`](../design.md). Infrastructure (Vercel/Supabase) lives
in [`vercel-supabase-handoff.md`](./vercel-supabase-handoff.md). Schema apply
status lives in [`pending-migrations-runbook.md`](./pending-migrations-runbook.md).
Per-change history lives in [`changes/`](../changes/).

**Production:** `https://budget-expense-seven.vercel.app`  
**Repo:** `https://github.com/Torrente179/budget-expense.git` (`main`)  
**Supabase (single project):** `awpygbfocmynxpadpsji` — auth + all app data

---

## 1. What the product is

Bilingual (EN/ES) personal **stewardship** app: track expenses and income, plan
a monthly budget with objectives (envelopes), give first, grow wealth, and
review patterns. Stack: Next.js 16 · React 19 · Tailwind v4 · Base UI / shadcn ·
Supabase · Vercel.

Five primary sections (nav from [`src/lib/navigation.ts`](../src/lib/navigation.ts)
only):

| Section | Route | Job |
|---|---|---|
| Home | `/home` | Now + actionable: Income · Spent · Current · Giving; plan pace + top objectives; “Where it went” donut; Attention; recent movements |
| Movements | `/movements` (+ `/recurring`) | Unified ledger (expenses + income), filters, swipe-delete, recurring |
| Budget | `/budget` | Guided setup when empty; else plan overview + objectives list + Giving card |
| Wealth | `/wealth` (+ investments / savings / liabilities) | Balances: owned and owed |
| Insights | `/insights` (+ calendar, category drilldown) | Past + patterns — no data-entry CTAs |

Secondary: `/review`, `/import`, `/wisdom`, `/settings`, `/onboarding` (first-run).

---

## 2. First-run onboarding (new users only)

**Route:** `/onboarding` — not in primary nav. Chrome (sidebar, topbar, tab bar,
FAB) is hidden on this route.

### Who sees the force-gate

Only profiles with `created_at >= 2026-07-18T00:00:00.000Z` that have neither
`onboarding_completed_at` nor `onboarding_skipped_at`. Older accounts are
**never** redirected into the wizard.

Constant: `ONBOARDING_FEATURE_LAUNCH` in
[`src/hooks/use-onboarding.ts`](../src/hooks/use-onboarding.ts).

### Entry paths

| Trigger | Behavior |
|---|---|
| Signup (email confirm required) | Show “Check your email”; link → `/auth/callback?next=/onboarding` |
| Signup (session returned) | → `/onboarding` |
| Authed visit to `/login` or `/signup` | Middleware → `/onboarding` if new + unsettled, else `/home` |
| Soft client gate | `OnboardingGate` in `(app)/layout` — same new-user rule |
| Skip | Every wizard step; persists + goes `/home` |
| Resume | Home banner + Settings “Setup guide” if new user never completed |
| Finish | Writes plan / recurring / debts / optional envelopes; sets completed |

### Skip must not bounce

Skip used to loop: wizard and gate held **separate** local state, so Home still
looked “pending” and redirected back. Fix:

1. Shared React Query key `queryKeys.onboardingProfile`
2. Optimistic cache update on skip/complete
3. Session flag `be-onboarding-dismissed` (`sessionStorage`)
4. Gate checks session dismiss before redirecting

**Skip for now** appears on: welcome, income, recurring, debt, goals, suggestions.

### Wizard steps

1. Welcome  
2. Monthly income → `monthly_budget_plans`  
3. Recurring / fixed (0–N)  
4. Debt / liabilities (0–N)  
5. Goals — budgeting help yes/no + multi-select  
6. Suggestions — method + starter envelopes when help requested  
7. Done → `/home`

**Goals** (`profiles.primary_goals`): `save_more`, `increase_wealth`,
`budget_tracking`, `decrease_expenses`, `pay_debt`, `give_generously`,
`build_emergency_fund`.

### Profile columns (applied)

Migration [`supabase/migrations/2026-07-18-onboarding-goals.sql`](../supabase/migrations/2026-07-18-onboarding-goals.sql)
— **applied** on live `awpygbfocmynxpadpsji`:

- `onboarding_completed_at`
- `onboarding_skipped_at`
- `wants_budget_help`
- `primary_goals text[] default '{}'`

### Personalization

[`src/lib/onboarding/personalize.ts`](../src/lib/onboarding/personalize.ts) →
method, seed envelopes, Home CTAs, Attention hints. Applied at finish via
[`apply.ts`](../src/lib/onboarding/apply.ts).

| Signal | Effect |
|---|---|
| `wants_budget_help` | Method % + 2–4 starter envelopes |
| `budget_tracking` | Budget + Movements shortcuts |
| `decrease_expenses` | Attention → Insights |
| `save_more` / `build_emergency_fund` | Savings-oriented method / Savings envelope |
| `pay_debt` | Attention → Liabilities; Wealth CTA |
| `increase_wealth` | Wealth CTA |
| `give_generously` | Giving envelope / Giving card emphasis |

Key files: `onboarding-wizard.tsx`, `onboarding-gate.tsx`, `use-onboarding.ts`,
middleware onboarding branch.

Change notes:
`changes/2026-07-18-onboarding-goals-budget-alerts.md`,
`changes/2026-07-18-fix-onboarding-skip-and-new-user-gate.md`.

---

## 3. In-app budget limit alerts

No push / email. Thresholds: **75%** warn · **90%** danger · **100%** over.

| Surface | Behavior |
|---|---|
| After expense capture | Toast with envelope name + %; action → `/budget` |
| Home Attention | Rows for envelopes ≥75% this month |
| Dedup | `sessionStorage` key `be-envelope-alert-toasts` per envelope+threshold |

Helpers: `src/lib/budgeting/envelope-alerts.ts`,
`notify-envelope-limits.ts`. Wired from `use-capture.ts`.

---

## 4. Navigation & chrome rules

- **Screen back:** `router.back()` when history exists; else `backHref` (or
  `/home`). Never a hard-coded `/home`-only Link for pushed screens.
- **Language:** never in `Screen` headers. Mobile → profile sheet toggle;
  Settings → full list; desktop/auth → compact chip.
- **Underline tabs:** Wealth sub-nav and Movements filters use
  `patterns/underline-tabs.tsx` (not filled pill chips).
- **Capture:** one form — `CaptureSheet` + FAB; optimistic expense add with Undo.

---

## 5. Home (current composition)

- Stat row: **Income** (positive) · **Spent** · **Current** (income − spent −
  transfers) · **Giving** — Spent/Income link into Movements tabs.
- Budgets area: paced remaining + top objectives, or empty CTA into `/budget`.
- “Where it went” category donut (top categories + Other).
- Attention feed (review, envelopes, anomalies, bills, onboarding hints).
- Recent movements.
- Personalized shortcuts + Import/Review — **desktop-only** (mobile uses tabs + FAB).
- Finish-setup banner when a new user skipped / never completed onboarding.

---

## 6. Budget (current composition)

- **Empty (no plan, no objectives):** 3-step guided setup — income → optional
  method → create objectives (plain-language copy; profile-aware when
  `wants_budget_help`).
- **Otherwise:** “Your plan” overview (remaining, pace bar) + objectives list
  (tap to edit) + standing Giving card.

---

## 7. Performance (expense path)

Documented in `changes/2026-07-18-expense-path-performance.md`:

- Home: single monthly summary fetch; summary-only adjacent prefetch
- Recurring sync: `POST /api/recurring/sync` (not on every GET)
- Lazy CaptureSheet; virtualized Movements; review count endpoint
- Household Insight RPCs (see §8 migrations) for aggregate queries

---

## 8. Supabase schema status (live)

Project `awpygbfocmynxpadpsji`. As of 2026-07-18 **all of these are applied**:

| Migration | What |
|---|---|
| `2026-07-18-onboarding-goals.sql` | Profile onboarding/goals columns |
| `2026-07-18-household-insights-aggregates-app.sql` | `liability_payment_totals` + index |
| `2026-07-18-household-insights-aggregates-ledger.sql` | `household_expense_category_aggregates`, `household_income_aggregates` (on app — single project) |

Verify:

```bash
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND (column_name LIKE 'onboarding%' OR column_name IN ('wants_budget_help','primary_goals'))"
node scripts/apply-sql.mjs --project app --query "SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (proname LIKE 'household%' OR proname='liability_payment_totals') ORDER BY 1"
```

Primary data owner: `pablopablo179@gmail.com`
(`36d56f02-711b-4eac-80df-803bdb599828`).

Signup confirmation requires correct Auth URL config (see
[`vercel-supabase-handoff.md`](./vercel-supabase-handoff.md) — Site URL must be
production, not localhost). Built-in SMTP is rate-limited.

---

## 9. Key code map

| Area | Location |
|---|---|
| Nav lists | `src/lib/navigation.ts` |
| Screen / back | `src/components/patterns/screen.tsx` |
| Underline tabs | `src/components/patterns/underline-tabs.tsx` |
| Onboarding UI + gate | `src/components/onboarding/` |
| Onboarding logic | `src/hooks/use-onboarding.ts`, `src/lib/onboarding/` |
| Capture writes | `src/hooks/use-capture.ts` |
| Envelope alerts | `src/lib/budgeting/envelope-alerts.ts` |
| Home | `src/components/home/home-screen.tsx`, `attention-feed.tsx` |
| Budget | `src/components/budget/budget-screen.tsx` |
| Query keys | `src/lib/query/keys.ts` |
| Auth middleware | `src/lib/supabase/middleware.ts` |
| Apply SQL | `node scripts/apply-sql.mjs --project app --file …` |

---

## 10. Related change notes (2026-07-18 cluster)

- `2026-07-18-onboarding-goals-budget-alerts.md`
- `2026-07-18-fix-onboarding-skip-and-new-user-gate.md`
- `2026-07-18-document-onboarding-in-design.md`
- `2026-07-18-expense-path-performance.md`
- `2026-07-18-smart-language-preference-ui.md`
- `2026-07-18-fix-mobile-spanish-language-switch.md`
- `2026-07-18-fix-capture-category-label-layout.md`
- `2026-07-18-home-stat-links-and-mobile-language.md`
- `2026-07-18-home-clarity-refinement.md`
- `2026-07-18-budget-objectives-and-home-stats.md`

---

*Update this file when product behavior, gating rules, or applied migrations
change. Keep `design.md` as the visual/system source of truth.*
