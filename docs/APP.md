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

## 2. Defaults — theme, language, voice

### Theme

- `next-themes` class strategy; **default theme is light**
  (`ThemeProvider` `defaultTheme="light"`).
- System preference still enabled; a saved user choice wins.
- See [`design.md`](../design.md) theme model.

### Language

- Supported locales: **EN** and **ES** only (`AppLocale`).
- **Default:** device / browser primary language
  (`Accept-Language` on SSR via root layout, then `navigator.language`).
  - Primary tag starts with `es` → Spanish
  - Anything else (including English, French, etc.) → English
- Explicit choice (Settings / language toggle) sets `be-locale-explicit` and
  persists; that wins over the device after that.
- Soft device default is **not** written to storage until the user picks.
- Helpers: `localeFromAcceptLanguage`, `localeFromDeviceLanguages`,
  `resolveAppLocale` in `src/lib/utils.ts`; provider
  `src/providers/locale-provider.tsx`.

### Voice / copy

- Warm, plain-spoken stewardship — not SaaS boilerplate or encyclopedia tone.
- Domain words: *stewardship, ledger, envelopes/pool, giving, tithe, wisdom*.
- Brand kicker: **Stewardship / Mayordomía**.
- Meta description: private ledger for spending, budgets, and giving.
- 2026-07-18 copy pass covered auth, onboarding, Home/Attention/Review,
  Insights/Wealth labels, Settings delete wording, Wisdom + method blurbs.

Change notes: `changes/2026-07-18-default-theme-light.md`,
`changes/2026-07-18-device-default-language.md`,
`changes/2026-07-18-natural-voice-copy-pass.md`.

---

## 3. First-run onboarding (new users only)

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
6. Suggestions — **choosable budget profile** (method list; goal-based suggestion
   pre-selected; user can tap another) + starter envelopes when help requested  
7. Done → `/home`

**Goals** (`profiles.primary_goals`): `save_more`, `increase_wealth`,
`budget_tracking`, `decrease_expenses`, `pay_debt`, `give_generously`,
`build_emergency_fund`.

### Budget profile on suggestions

- When `wants_budget_help` is yes, the suggestions step lists every method from
  `getBudgetingMethods(locale)` as a radio list.
- One method is marked **Suggested** from goals/debts
  (`buildPersonalization` without override).
- Until the user taps another method, the suggestion stays selected; after they
  pick, that choice is sticky even if they go back and change goals.
- Finish passes `methodId` into `applyOnboardingPersonalization` → plan
  `allocation_percent` from the chosen method’s slices.

### Profile columns (applied)

Migration [`supabase/migrations/2026-07-18-onboarding-goals.sql`](../supabase/migrations/2026-07-18-onboarding-goals.sql)
— **applied** on live `awpygbfocmynxpadpsji`:

- `onboarding_completed_at`
- `onboarding_skipped_at`
- `wants_budget_help`
- `primary_goals text[] default '{}'`

### Personalization

[`src/lib/onboarding/personalize.ts`](../src/lib/onboarding/personalize.ts) →
method, seed envelopes, Home CTAs, Attention hints. Optional `methodId`
overrides the goal-based suggestion. Applied at finish via
[`apply.ts`](../src/lib/onboarding/apply.ts).

| Signal | Effect |
|---|---|
| `wants_budget_help` | Method % + 2–4 starter envelopes |
| User-picked `methodId` | Wins over goal-based method suggestion |
| `budget_tracking` | Budget + Movements shortcuts |
| `decrease_expenses` | Attention → Insights |
| `save_more` / `build_emergency_fund` | Savings-oriented method / Savings envelope |
| `pay_debt` | Attention → Liabilities; Wealth CTA |
| `increase_wealth` | Wealth CTA |
| `give_generously` | Giving envelope; sets `tithe_target_percent` to 10%; ensures Tithe/Diezmo category |

Key files: `onboarding-wizard.tsx`, `onboarding-gate.tsx`, `use-onboarding.ts`,
middleware onboarding branch.

Change notes:
`changes/2026-07-18-onboarding-goals-budget-alerts.md`,
`changes/2026-07-18-fix-onboarding-skip-and-new-user-gate.md`,
`changes/2026-07-18-onboarding-choosable-budget-profile.md`.

---

## 4. Capture (expenses & income)

Single surface: `CaptureSheet` + global FAB (`CaptureFab`). Also opened from
Movements for create/edit.

### Rules (must hold)

1. **Await save before close** — never dismiss the sheet (or unmount it) until
   `addExpense` / `addIncome` / update succeeds. On error, keep the sheet open;
   toasts come from `use-capture`.
2. **Keep sheet mounted while open** — FAB and Movements pass `open={…}`; do
   not remount-destroy mid-request.
3. **Currency seeds only on open edge** (false → true). Do **not** reset
   currency when `baseCurrency` loads later (that wiped COP → EUR).
4. **Snapshot currency** into the payload before awaits.
5. **Persist last-used currency** for expense *and* income
   (`lib/capture/defaults.ts`).
6. **Save & add another** (create mode) — saves, clears amount/description,
   keeps kind + currency + category/source, stays open.
7. Income requires **Source**; expense requires **Category**.
8. Optimistic updates for **both** expense and income.
9. Ledger rows use `AmountText` with `showOriginal` so foreign currencies
   (e.g. COP) show next to the converted base amount.

Change note: `changes/2026-07-18-fix-capture-multi-add-currency-income.md`.

---

## 5. Giving / Generosidad (income-based)

Giving is a **share of income**, never a mirror of total expenses.

| Concept | Source |
|---|---|
| Target | `resolveGivingTarget` in `src/lib/giving.ts`: `tithe_target_percent` × (**plan income** first, else recorded income) |
| Given | Sum of expenses classified / named as giving (Tithe, Diezmo, Donaciones, etc.) |
| Home + Budget cards | **Primary number = target**; detail = amount given toward it |
| Onboarding `give_generously` | Sets profile `tithe_target_percent` to 10%; seeds Generosidad envelope; creates Tithe/Diezmo category if missing so the envelope never binds to essentials/lifestyle |

Settings → Stewardship still edits the giving % of income.

Change note: `changes/2026-07-18-fix-giving-income-based.md`.

---

## 6. In-app budget limit alerts

No push / email. Thresholds: **75%** warn · **90%** danger · **100%** over.

| Surface | Behavior |
|---|---|
| After expense capture | Toast with envelope name + %; action → `/budget` |
| Home Attention | Rows for envelopes ≥75% this month |
| Dedup | `sessionStorage` key `be-envelope-alert-toasts` per envelope+threshold |

Helpers: `src/lib/budgeting/envelope-alerts.ts`,
`notify-envelope-limits.ts`. Wired from `use-capture.ts`.

---

## 7. Navigation & chrome rules

- **Screen back:** `router.back()` when history exists; else `backHref` (or
  `/home`). Never a hard-coded `/home`-only Link for pushed screens.
- **Language:** never in `Screen` headers. Mobile → profile sheet toggle;
  Settings → full list; desktop/auth → compact chip.
- **Underline tabs everywhere:** `patterns/underline-tabs.tsx` is the only
  in-screen view switcher app-wide (Wealth sub-nav, Movements filters,
  Wisdom sections, Import review filter). `@/components/ui/tabs` (filled
  pill chips) is retired — zero consumers.
- **Status indicators:** `patterns/status-tag.tsx` (tone dot + label in ink)
  is the only way to show state (Buy/Sell, Deposit/Withdrawal, Over-budget,
  etc.) — never an uppercase tinted pill.
- **Capture:** one form — `CaptureSheet` + FAB (see §4).

---

## 8. Home (current composition)

- Stat row: **Income** (positive) · **Spent** · **Current** (income − spent −
  transfers) · **Giving** (income-based **target** as the hero number; given
  shown in the detail line) — Spent/Income link into Movements tabs.
- Budgets area: paced remaining + top objectives, or empty CTA into `/budget`.
- “Where it went” category donut (top categories + Other).
- Attention feed (review, envelopes, anomalies, bills, onboarding hints).
- Recent movements.
- Personalized shortcuts + Import/Review — **desktop-only** (mobile uses tabs + FAB).
- Finish-setup banner when a new user skipped / never completed onboarding.

---

## 9. Budget (current composition)

- **Empty (no plan, no objectives):** 3-step guided setup — income → optional
  method → create objectives (plain-language copy; profile-aware when
  `wants_budget_help`).
- **Otherwise:** “Your plan” overview (remaining, pace bar) + objectives list
  (tap to edit; always-visible delete) + standing Giving card (income-based
  target as primary). Monthly plan can be deleted from the plan sheet
  (confirm); expenses and objectives are kept.


---

## 10. Movements (current composition)

- Unified ledger: expenses + income, underline filter tabs, search,
  swipe-delete (mobile), edit via CaptureSheet.
- Desktop: readable centered width; date labels aligned with row inset;
  delete control in a stable trailing column (hover + keyboard focus).
- Amounts show converted base value plus original currency when different
  (`showOriginal` on `TransactionRow` → `AmountText`).

Change note: `changes/2026-07-18-fix-desktop-movements-alignment.md`.

---

## 11. Wealth (current composition)

- **Overview** (`/wealth`): net worth + allocation together in one hero card
  — big net-worth number, then a `BreakdownDonut` split across
  investments / savings / broker cash (center total, legend with share %
  and amount). A 3-up stat row (cash runway / months of buffer, kept over
  12mo, debts). Premium jump-in cards to Investments / Savings / Debts.
  FX shown as **By currency**.
- **Investments** (`/wealth/investments`): `UnderlineTabs` for
  Overview / Orders / Cash / Watchlist.
  Overview/cash mini-stats are plain label+number pairs, not bordered
  blocks. Buy/Sell and Deposit/Withdrawal use `StatusTag`.
- **Savings** / **Liabilities**: unchanged data model, same `WealthNav`
  underline sub-nav.
- Shared sub-nav: `src/components/wealth/wealth-nav.tsx` (underline tabs,
  not chips).

Change note: `changes/2026-07-18-premium-sweep-wealth-insights.md`.

---

## 12. Insights (current composition)

Past + patterns only — no data-entry CTAs (see the editorial rule in
`design.md` §1).

- Ratio stat row (savings rate, expense ratio, budget usage, transactions).
- Last-12-month pillars (Giving · Spending · Saving) when income data exists.
- 12-month spending trend + this-month cumulative-spend charts
  (`ChartCard`).
- Category breakdown, budget use against plan (rows; over-budget uses
  `StatusTag`), anomalies (“Heads up”), monthly report, giving insights,
  income sources (“Where it came from”).
- Footer link to `/wisdom`.

Change note: `changes/2026-07-18-premium-sweep-wealth-insights.md`.

---

## 13. Performance (expense path)

Documented in `changes/2026-07-18-expense-path-performance.md`:

- Home: single monthly summary fetch; summary-only adjacent prefetch
- Recurring sync: `POST /api/recurring/sync` (not on every GET)
- CaptureSheet loads with FAB; virtualized Movements; review count endpoint
- Household Insight RPCs for aggregate queries

---

## 14. Supabase schema status (live)

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

## 15. Key code map

| Area | Location |
|---|---|
| Nav lists | `src/lib/navigation.ts` |
| Screen / back | `src/components/patterns/screen.tsx` |
| Underline tabs | `src/components/patterns/underline-tabs.tsx` |
| Status indicator | `src/components/patterns/status-tag.tsx` |
| Shared donut | `src/components/patterns/breakdown-donut.tsx` |
| Locale + device default | `src/providers/locale-provider.tsx`, `src/lib/utils.ts` |
| Theme default | `src/providers/theme-provider.tsx` |
| Onboarding UI + gate | `src/components/onboarding/` |
| Onboarding logic | `src/hooks/use-onboarding.ts`, `src/lib/onboarding/` |
| Capture UI | `src/components/capture/capture-sheet.tsx`, `capture-fab.tsx` |
| Capture writes | `src/hooks/use-capture.ts` |
| Capture defaults | `src/lib/capture/defaults.ts` |
| Giving helpers | `src/lib/giving.ts` (`resolveGivingTarget`, `isGivingExpense`) |
| Envelope alerts | `src/lib/budgeting/envelope-alerts.ts` |
| Home | `src/components/home/home-screen.tsx`, `attention-feed.tsx` |
| Budget | `src/components/budget/budget-screen.tsx` |
| Movements | `src/components/movements/movements-screen.tsx`, `virtualized-ledger.tsx` |
| Wealth | `src/components/wealth/wealth-overview.tsx`, `wealth-nav.tsx` |
| Insights | `src/components/insights/insights-screen.tsx` |
| Wisdom content | `src/lib/financial-wisdom.ts`, `src/lib/budgeting-methods.ts` |
| Query keys | `src/lib/query/keys.ts` |
| Auth middleware | `src/lib/supabase/middleware.ts` |
| Apply SQL | `node scripts/apply-sql.mjs --project app --file …` |

---

## 16. Related change notes (2026-07-18 cluster)

### Defaults, voice, language

- `2026-07-18-natural-voice-copy-pass.md`
- `2026-07-18-default-theme-light.md`
- `2026-07-18-device-default-language.md`
- `2026-07-18-smart-language-preference-ui.md`
- `2026-07-18-fix-mobile-spanish-language-switch.md`
- `2026-07-18-home-stat-links-and-mobile-language.md`

### Onboarding & giving

- `2026-07-18-onboarding-goals-budget-alerts.md`
- `2026-07-18-fix-onboarding-skip-and-new-user-gate.md`
- `2026-07-18-document-onboarding-in-design.md`
- `2026-07-18-onboarding-choosable-budget-profile.md`
- `2026-07-18-fix-giving-income-based.md`

### Capture & movements

- `2026-07-18-fix-capture-multi-add-currency-income.md`
- `2026-07-18-fix-capture-category-label-layout.md`
- `2026-07-18-fix-desktop-movements-alignment.md`

### Home, budget, wealth, insights, brand

- `2026-07-18-home-clarity-refinement.md`
- `2026-07-18-budget-objectives-and-home-stats.md`
- `2026-07-18-fix-budget-math-mismatch-and-method-clarity.md`
- `2026-07-18-fix-budget-setup-cta-layout.md`
- `2026-07-18-fix-large-currency-layout.md`
- `2026-07-18-premium-sweep-wealth-insights.md`
- `2026-07-18-expense-path-performance.md`
- `2026-07-18-new-budget-expense-favicon.md`
- `2026-07-18-document-brand-icon-system.md`
- `2026-07-18-fix-signup-confirmation-email.md`
- `2026-07-18-app-handbook-documentation.md`
- `2026-07-18-sync-app-handbook-wealth-insights.md`
- `2026-07-18-document-session-product-rules.md` (this sync)

---

*Update this file when product behavior, gating rules, or applied migrations
change. Keep `design.md` as the visual/system source of truth.*
