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
| Home | `/home` | Now + actionable: compact black hero (income − spent remaining, pace, daily); Presupuesto cards only (`spending_limit`); category donut with legend % (no callouts); recent movements |
| Movements | `/movements` (+ `/recurring`) | Unified ledger (expenses + income), filters, swipe-delete, recurring |
| Budget | `/budget` | Compact hero + dual engines: **Presupuestos** (ceilings) + **Metas de aportación** (floors); plan distribution + recommendation |
| Patrimonio | `/wealth` (+ accounts / investments / savings / liabilities / loans) | The balance sheet: `netWorth = (accounts + savings + investments + moneyLent) − debts`; net-worth hero, Evolución, Activos y deudas, Colchón financiero, Organiza tu dinero |
| Insights | `/insights` (+ calendar, category drilldown) | Past + patterns — ratios, clickable spend charts, monthly report, calendar; no data-entry CTAs |

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
- **Default:** the static server shell renders English, then the client resolves
  the device / browser primary language from `navigator.languages`.
  - Primary tag starts with `es` → Spanish
  - Anything else (including English, French, etc.) → English
- Explicit choice (Settings / language toggle) sets `be-locale-explicit` and
  persists; that wins over the device after that.
- Soft device default is **not** written to storage until the user picks.
- Helpers: `localeFromDeviceLanguages` and `resolveAppLocale` in
  `src/lib/locale.ts`; provider
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
- Finish passes `methodId` into `applyOnboardingPersonalization` → seeds
  starter envelopes from the method; the monthly plan stores **income only**
  (`allocation_percent` is always persisted as `100` for the NOT NULL column —
  not a user-facing “protected %”).

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
| `wants_budget_help` | 2–4 starter envelopes from the chosen/suggested method |
| User-picked `methodId` | Wins over goal-based method suggestion |
| `budget_tracking` | Attention / empty-state emphasis toward Budget + Movements |
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
10. Expense category suggest returns up to **3 ranked** picks (rules + history).
    Alternative chips in the sheet; correcting away from the top pick can
    auto-learn a merchant keyword (see §9b).

Change notes: `changes/2026-07-18-fix-capture-multi-add-currency-income.md`,
`changes/2026-07-24-budget-roles-and-smarter-categorization.md`.

---

## 5. Giving / Generosidad (income-based)

Giving is a **share of income**, never a mirror of total expenses.

| Concept | Source |
|---|---|
| Target | `resolveGivingTarget` in `src/lib/giving.ts`: `tithe_target_percent` × (**plan income** first, else recorded income) |
| Given | Sum of expenses classified / named as giving (Tithe, Diezmo, Donaciones, etc.) |
| Home | **Primary number = target**; detail = amount given toward it |
| Budget | No dedicated Primicias card (removed 2026-07-24). Methods may seed **Donations / Tithe** envelopes via `budget_role` |
| Onboarding `give_generously` | Sets profile `tithe_target_percent` to 10%; seeds Generosidad envelope; creates Tithe/Diezmo category if missing |

Settings → Stewardship still edits the giving % of income.

Change notes: `changes/2026-07-18-fix-giving-income-based.md`,
`changes/2026-07-24-remove-primicias-card-from-budget.md`.

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

Desktop layout (`lg+`): hero full-width, then two columns —

- **Left (`lg:col-span-3`):** recent movements.
- **Right (`lg:col-span-2`):** Presupuestos card stacked above the
  “Tus gastos por categoría” donut (same narrow width).

Mobile order: hero → Presupuestos → donut → movements.

Desktop quick-action shortcuts were **removed** 2026-07-24 — navigation is
primary nav + FAB.

### Hero summary card

Compact **black** card (`HomeSummaryCard` — denser padding/type/ring as of
2026-07-24). Chrome comes from `src/components/patterns/hero-surface.tsx`,
shared with the Budget hero: graphite→black gradient, hairline `white/10` edge,
top-edge sheen, `white/55` labels against white numbers, and `HERO_ACCENT`
(`#34D399`) for income / healthy states. Dark mode lifts the gradient a step so
the card still reads as a card. Math in `src/lib/home/month-cashflow.ts`:

- **Income base:** plan income when set, else recorded income.
- **Remaining (“Te quedan …”):** `monthlyIncome − actualOutflows` (spent).
  Not the checkpoint bank balance (that stays Settings / Wealth).
- **Used %:** `outflows / income`; circular ring (~88px) on desktop; mobile bar
  shows % spent / % available.
- **Pace marker:** vertical tick at `currentDay / daysInMonth`.
- **Daily guide:** `max(remaining, 0) / max(daysInMonth − currentDay, 1)`
  (excludes today; floors at 1 day).
- **Pace status:** over plan / on track / slightly ahead / high pace.

### Presupuestos card

- **Metas-style tiles, three across** per custom budget (spent ÷ limit): tinted
  round category glyph and usage-band ring with the `%` inside on top, then
  name, spent, and `of <limit>`. Tiles scale off their own width (container
  queries) so the row works in the Home column and on a phone.
- Ring **fill clamps at 100%**; the **% label can exceed 100%**. The label reads
  `foreground` until the budget is over limit, then takes the band color — as
  does the spent amount. Pace mark still shows month progress on the current
  month.
- **Usage-band colors** (shared with `/budget`, see §9 and `src/lib/palette.ts`):

  | Band | Ratio | Color |
  |---|---|---|
  | Safe | 0–69% | `#22C55E` |
  | Watch | 70–84% | `#F59E0B` |
  | Near limit | 85–99% | `#F97316` |
  | Exceeded | 100–119% | `#EF4444` |
  | Critical | 120%+ | `#BE123C` |

- **Max 3 cards per page**; more budgets swipe (snap + dots).
- Empty state: CTA into `/budget`.
- **Only Presupuestos** (`kind = spending_limit`). Metas (`contribution_goal`:
  Diezmo, Ahorro, Inversión, …) live on `/budget` — never on this Home card.

### Rest of Home

- Category donut with legend percentages; **no callout connector lines**
  (`calloutCount={0}`). DB category colors unchanged.
- Finish-setup banner when a new user skipped / never completed onboarding.
- Primary navigation + FAB cover Movements / Budget / Import / Review.

Change notes: `changes/2026-07-24-home-hero-and-presupuesto-cards.md`,
`changes/2026-07-24-home-presupuestos-only-metas-on-budget.md`,
`changes/2026-07-24-compact-month-hero-cards.md`,
`changes/2026-07-24-document-dual-engine-home-budget-session.md`,
`changes/2026-07-23-home-desktop-two-column-layout.md`,
`changes/2026-07-23-home-per-budget-rings.md`,
`changes/2026-07-24-clarity-palette-v2.md`,
`changes/2026-07-24-remove-home-quick-actions.md`.

---

## 9. Budget (current composition)

### Mental model

1. **Monthly income** — expected income for the month (`monthly_budget_plans`).
   There is no user-facing “protected budget %”. The DB column
   `allocation_percent` is always written as `100`
   (`MONTHLY_PLAN_FULL_ALLOCATION` in `src/lib/validations.ts`).
2. **Two envelope engines** (`custom_budgets.kind`):
   - **Presupuestos** (`spending_limit`) — spending ceilings; 100% = exceeded.
   - **Metas de aportación** (`contribution_goal`) — contribution floors
     (tithe, savings, investing, …); 100% = success.
3. **Methods** — frameworks (50/30/20, Base cero, 5 Jarras, …) that **create**
   those envelopes from each category’s `budget_role` (see §9b), including
   `kind` via method seed / backfill. Methods do not set a separate plan
   “protected %”.

UI totals prefer the sum of custom-budget limits when envelopes exist (not a
shrunk income pool).

### Home vs Budget placement

| Surface | Presupuestos | Metas |
|---|---|---|
| `/home` Presupuestos card | Yes | **No** |
| `/budget` | Yes | Yes |

`prepare_month_snapshot` must return `kind` (migration
`2026-07-24-month-snapshot-budget-kind.sql`). Client fallback:
`resolveBudgetKind()` infers from category roles if `kind` is missing.

### UI

- **Empty (no income, no budgets):** guided setup — set income → optional
  method → create budgets. Full-width card.
- **Otherwise:** black **BudgetSummaryHero** (compact density) then
  side-by-side **Presupuestos** + **Metas de aportación**; plan distribution
  (both engines) + recommendation (overspent Presupuestos).
- **Create / edit — `BudgetWizard`** (`src/components/budgets/budget-wizard.tsx`):
  centered modal on desktop, bottom sheet under 768px.
  - Create runs **Tipo → Configuración → Revisar**; edit skips the type step
    (2 steps) and locks the kind — changing engine mid-month would reclassify
    history.
  - Step 2 branches: a limit asks for *Límite mensual* + warning threshold; a
    goal asks for *Objetivo mensual* (importe fijo or % de ingresos, with the
    resolved estimate) and never shows a threshold. Copy forks too — *aportado
    / completado / objetivo* vs *gastado / usado / límite*.
  - The preview panel renders the real card **already matched against this
    month's movements**, so nothing jumps after saving; step 3 states the
    match explicitly ("ya tiene X gastados este mes").
  - Picking a category that belongs to another budget warns inline — spending
    counts in both and plan distribution double-counts it (no parent/child
    envelopes exist yet).
  - Closing with unsaved input asks *¿Descartar los cambios?*; Back preserves
    everything.
- **Per-budget settings:** `custom_budgets.warn_threshold` (null → the default
  75/90/100 ladder in `envelope-alerts.ts`; 50–99 → warn once there, then at
  100%) and `repeats_monthly` (whether *Copiar &lt;mes&gt;* carries it forward —
  the copy RPC filters on it).
- **No Primicias / Generosidad card** (giving stays on Home / Insights /
  Settings; methods may still seed Donations / Tithe as Metas).
- Applying a method with existing budgets opens an **in-app** replace dialog
  (not `window.confirm`). Seeding uses RPC `replace_custom_budget_set` (fixed
  `jsonb_array_elements_text` for category UUIDs) with a client fallback.

Change notes: `changes/2026-07-24-budget-dual-engines-mockup.md`,
`changes/2026-07-24-home-presupuestos-only-metas-on-budget.md`,
`changes/2026-07-24-compact-month-hero-cards.md`,
`changes/2026-07-24-document-dual-engine-home-budget-session.md`,
`changes/2026-07-24-budget-tab-usage-band-colors.md`,
`changes/2026-07-24-budget-two-column-layout.md`,
`changes/2026-07-24-remove-protected-budget-percent.md`,
`changes/2026-07-24-visible-delete-monthly-income.md`,
`changes/2026-07-24-remove-primicias-card-from-budget.md`,
`changes/2026-07-24-fix-method-seed-confirm-and-rpc.md`,
`changes/2026-07-25-budget-wizard-modal.md`,
`changes/2026-07-24-black-hero-surface.md`,
`changes/2026-07-24-home-budget-cards-mockup-grid.md`,
`changes/2026-07-25-document-black-hero-and-wizard-session.md`.

---

## 9b. Category `budget_role` + smarter suggest

### Budget role vs classification

Each category has `budget_role` (closed vocabulary) **in addition to**
stewardship `classification` (essential / discretionary / giving / savings).

| Used for | Field |
|---|---|
| Insights pillars, liquidity, giving detection | `classification` |
| Which method envelope a category joins | `budget_role` |

Examples: `housing`, `groceries`, `insurance`, `dining`, `tithe`, `donations`,
`savings`, `investments`, `loan_lent` (money **you** lend — Wealth → Loans;
never seeds into “savings” or debt-payment envelopes), `income` (Salary /
Other Income — excluded from spend seeds).

Settings → **Category roles** edits both fields
(`src/components/settings/category-classification.tsx`). Defaults include
Insurance, Cash, Savings, Investments. Applied data pass: Generali / Mutua
Madrileña → Insurance; ATM withdrawals → Cash (rent paid partly in cash may
still be manually Housing).

Method seeding:
[`src/lib/budgeting/method-seed.ts`](../src/lib/budgeting/method-seed.ts) +
[`budget-roles.ts`](../src/lib/budgeting/budget-roles.ts) — slice → roles;
giving slices **create** envelopes; leftovers go only to lifestyle/wants-style
slices.

### Capture / import suggest

[`GET /api/categorization/suggest`](../src/app/api/categorization/suggest/route.ts)
returns ranked **top 3**: rule matches first, then similar past expenses
([`categorize.ts`](../src/lib/ledger/categorize.ts)). Capture shows suggestion
chips; picking a non-top category **learns** a short merchant pattern via
[`extractMerchantPattern`](../src/lib/ledger/merchant-pattern.ts) (not the full
bank line). Import “remember” uses the same extraction.

Change note: `changes/2026-07-24-budget-roles-and-smarter-categorization.md`.

---

## 10. Movements (current composition)

- Unified ledger: expenses + income, underline filter tabs, search,
  swipe-delete (mobile), edit via CaptureSheet.
- Desktop: readable centered width; date labels aligned with row inset;
  delete control in a stable trailing column (hover + keyboard focus).
- Amounts show converted base value plus original currency when different
  (`showOriginal` on `TransactionRow` → `AmountText`).
- Balance-reconciliation surplus/deficit rows use standard bilingual names
  and localize in the active language (same helper as Calendar).

Change notes: `changes/2026-07-18-fix-desktop-movements-alignment.md`,
`changes/2026-07-24-balance-adjustment-movements.md`.

---

## 10b. Settings — Available balance reconciliation

Settings → **Available balance** (`BalanceCheckpointSettings`):

1. User enters the bank’s available balance for today (after posting today’s
   existing movements). Localized decimal parsing is supported.
2. The UI previews the delta vs tracked balance (or month-to-date net flow on
   the first reconciliation).
3. On save, `POST /api/balance-checkpoints`:
   - stores the checkpoint + audit `reconciliation_delta`;
   - if the delta ≠ 0, books a ledger movement on that date:
     - **surplus** → income (`Other Income` when available);
     - **deficit** → expense (`Other` category);
   - standard names (EN stored / ES localized in UI):

| Basis | Surplus | Deficit |
|---|---|---|
| Opening (`monthly_net`) | Opening balance surplus / Superávit del saldo inicial | Opening balance deficit / Déficit del saldo inicial |
| Tracked (`tracked_balance`) | Reconciliation surplus / Superávit de conciliación | Reconciliation deficit / Déficit de conciliación |

4. The movement is created **before** the checkpoint so tracked Available does
   not double-count the adjustment. Checkpoint failure rolls the movement back.
5. Home / Movements / income-expense queries are invalidated after a successful
   reconcile.

Change note: `changes/2026-07-24-balance-adjustment-movements.md`.
Architecture: `Architecture/06-domain-logic.md` §6.4, AD-8 in
`Architecture/10-architectural-decisions.md`.

---

## 11. Patrimonio (current composition)

The personal balance sheet. It answers *what do I own, what do I owe, what am I
worth today*; Presupuesto answers *what came in, what went out, what can I spend
this month*. The same euro must never be counted in both.

### The math — `src/lib/wealth/net-worth.ts` (pure, shared)

```
totalAssets      = accountsAndCash + savings + investments + moneyLent
totalLiabilities = debts
netWorth         = totalAssets − totalLiabilities
```

**Available money is a different figure** and is *not* a Patrimonio headline —
only `include_in_available` accounts, plus available savings, minus reservations.
A €9.950 net worth can sit beside €2.500 of spendable money.

- `monthlyChange` = current − the previous month's closing net worth (the latest
  snapshot on or before the last day of last month). No prior snapshot → both
  the amount and the percentage are `null` and the hero renders **no** change
  line. A zero previous month gives an amount but never an infinite percentage.
- `cushionMonths` = liquid money ÷ average monthly essential spend, against a
  6-month target. Tones: `<1` critical · `1–<3` building · `3–<6` good · `≥6`
  strong. The essential average comes from `useHouseholdInsights`, which uses
  the **6** most recent months that have data (`ESSENTIAL_WINDOW_MONTHS`) — the
  copy must not claim a 12-month average.
- Everything is computed once in `useNetWorth()`. No screen re-derives a total.

### Overview (`/wealth`)

- **Black net-worth hero** (`patrimonio-hero.tsx`) on the shared
  `patterns/hero-surface.tsx` chrome. Empty state is
  "Construye tu patrimonio" + `+ Añadir primera cuenta`; populated shows net
  worth, the signed monthly change, and an `Activos · Deudas` split.
- **Quick-glance row:** Evolución (net-worth area chart, 1M/3M/6M/1Y/All),
  Activos y deudas (two-slice `BreakdownDonut`, net worth in the centre), and
  Colchón financiero (`StatusTag` + `ProgressMeter`).
- **Tabs:** Resumen · Activos · Deudas via `UnderlineTabs` (in-screen state).
- **Organiza tu dinero:** five cards → Cuentas y efectivo · Ahorros ·
  Inversiones · Dinero prestado · Deudas. An empty category still opens its
  parent page, never a modal.
- Empty state swaps the quick-glance row for a "Lo que verás aquí" preview
  rather than rendering zeros.

### Navigation

Patrimonio is a **hub with pushed category pages**
(`Patrimonio → category → item`). The old five-item `WealthNav` underline
sub-nav is deleted; sub-pages carry a `Patrimonio / <category>` breadcrumb
(`wealth-breadcrumb.tsx`) plus `Screen`'s back chevron.

### Category pages

- **Cuentas y efectivo** (`/wealth/accounts`): black hero (total liquid,
  spendable, count), list, inline add form. The opening balance is stated as a
  starting snapshot, **not** income for the month.
- **Investments** (`/wealth/investments`): `UnderlineTabs` for
  Overview / Orders / Cash / Watchlist. Buy/Sell and Deposit/Withdrawal use
  `StatusTag`.
- **Savings** (`/wealth/savings`): black hero (total saved, net moved this
  month, funds/movements/currencies). Movements now carry a **direction** —
  deposit or withdrawal. The form takes a positive amount and
  `signedSavingsAmount()` signs it at the API boundary;
  `investment_savings_transfers.amount` is signed in the DB.
- **Loans** (`/wealth/loans`): black hero (pendiente por cobrar, recovery
  progress, total lent / recovered / active). Reuses `sumLoansOutstandingBase`
  so the page and the Patrimonio hero cannot disagree.
- **Liabilities** (`/wealth/liabilities`): black hero (deuda pendiente, payoff
  progress, paid / original / active).

### Creation wizards

`components/patterns/wizard-modal.tsx` is the shared three-step shell —
Dialog on desktop, bottom `Sheet` under 768px — extracted from `BudgetWizard`,
which now runs on it. `useDiscardPanel()` supplies the "¿Descartar los
cambios?" body/footer.

Step 3 of every wizard shows `<FinancialImpact>`, driven by
`lib/wealth/transaction-effects.ts`. That module encodes the rules users get
wrong: an opening balance is not income, a transfer is not an expense, a market
gain is not salary, recovered principal is not income. The preview and the
write read the same function so they cannot drift.

`AccountWizard` (`/wealth/accounts`) is the reference implementation. The
savings, investment, loan and debt wizards are not built yet — those categories
keep their existing single-step forms.

Change notes: `changes/2026-07-25-patrimonio-net-worth-foundation.md`,
`changes/2026-07-18-premium-sweep-wealth-insights.md`.

---

## 11b. Accounts and net-worth history

**`wealth_accounts`** is the cash the balance sheet was missing — checking,
savings, cash, digital wallet. Balance is derived
(`opening_balance + Σ wealth_account_movements.amount`), matching how
liabilities and loans already work. `include_in_available` decides spendability
only; net worth always counts the account.

**Relationship to `balance_checkpoints`.** Checkpoints remain the reconciliation
tool and are **not** added to `totalAssets`, so there is no double count. A user
with both will still see two figures for "my cash" until the Settings
reconciliation is pointed at `wealth_accounts.is_primary` — the column ships as
that seam.

**`net_worth_snapshots`** — one row per user per day, enforced by
`UNIQUE (user_id, as_of_date)`; the writer upserts, so the once-a-day rule is
structural. Totals are stored already converted, with the base currency
recorded.

The write happens **on the client** (`useNetWorth`): conversion only exists in
`CurrencyProvider.convert`, so no trigger or cron could compute net worth. It is
guarded by a ref holding the last attempted date+value, and on success writes
into the cache with `setQueryData` — invalidating would refetch, recompute and
re-fire. Month-end needs no cron: the last day the user opened the app in a
month is that month's closing snapshot. **History is not backfilled.**

---

## 12. Insights (current composition)

Past + patterns only — no data-entry CTAs (see the editorial rule in
`design.md` §1).

- Ratio stat row (savings rate, expense ratio, budget usage, transactions).
- Last-12-month pillars (Giving · Spending · Saving) when income data exists.
- **Spend trend charts** (`DeferredInsightsTrendCharts` → `InsightsTrendCharts`,
  `ChartCard`):
  - **Monthly spending, 12 months** — bar per month.
  - **Daily spending** — bar per day for the selected month; **current month
    stops at today** (no flat future tail). Empty days keep a tiny
    `minPointSize` so columns stay clickable.
  - Series fill: soft magenta `SPEND_CHART_COLOR` (`#EC4899` in
    `charts/chart-theme.tsx`) — expense-adjacent, not success green and not
    alarm raspberry. Amount text elsewhere still uses `--expense`.
  - **Drilldown:** click a day bar → `/insights/calendar?day=N` (calendar
    opens that day’s sheet). Click a month bar → `setMonthYear` +
    `/movements?tab=expenses`. Chart clicks resolve the bar via Recharts
    `activeIndex` (not legacy `activePayload`).
- **Budget use** against plan (rows; over-budget uses `StatusTag`), anomalies
  (“Heads up”), **monthly report** (“Spending analysis” — includes the
  category spend bars), giving insights, income sources (“Where it came
  from”).
- There is **no** separate Insights card for “Where it went / Spending by
  category”; that list duplicated the monthly report and was removed.
- Calendar (`/insights/calendar`) reads `?day=` and auto-opens the day
  detail sheet (page wrapped in `Suspense` for `useSearchParams`).
- Footer link to `/wisdom`.

Change notes: `changes/2026-07-18-premium-sweep-wealth-insights.md`,
`2026-07-24-remove-duplicate-insights-category-chart.md`,
`2026-07-24-insights-daily-spend-chart.md`,
`2026-07-24-insights-chart-day-month-drilldown.md`.

---

## 13. Performance architecture

The authoritative baseline, implementation, rollout, and rebuild record is
[`performance-and-rebuild-plan.md`](./performance-and-rebuild-plan.md).

- The app shell is statically eligible; root rendering no longer reads request
  headers. Stored/browser language is resolved client-side.
- Home shares `get_app_bootstrap()` and `prepare_month_snapshot()` caches.
  Attention Feed selects from those caches instead of launching a duplicate
  request wave.
- Month preparation atomically materializes missing recurring rows and only
  invalidates a month when inserts occurred. The old sync route is a
  compatibility adapter, not the normal read path.
- Adjacent months prefetch on pointer/focus/touch intent, not on a 600 ms timer.
- Capture, movement editing, Command Menu, and Profile contents mount/load only
  after first interaction. Movements remain virtualized.
- Budget, brokerage, trade, cash, watchlist, and savings forms load only after
  their trigger is used; Insights charts load near the viewport.
- Household data uses one RLS-protected RPC; market quote inputs are deduped,
  bulk-cache checked, and capped at five provider calls concurrently.
- Investments use a compact overview payload plus independent cached pages for
  orders, cash, savings movements, and watchlist data.
- Direct RPCs are additive and fall back to the legacy API for one release.
  Production migration/deployment remains a separate reviewed action.

---

## 14. Supabase schema status (live)

Project `awpygbfocmynxpadpsji`. As of 2026-07-24 **all of these are applied**:

| Migration | What |
|---|---|
| `2026-07-18-onboarding-goals.sql` | Profile onboarding/goals columns |
| `2026-07-18-household-insights-aggregates-app.sql` | `liability_payment_totals` + index |
| `2026-07-18-household-insights-aggregates-ledger.sql` | `household_expense_category_aggregates`, `household_income_aggregates` (on app — single project) |
| `2026-07-24-palette-v2-category-colors.sql` | Clarity category hex update by known EN/ES names (Housing kept/restored yellow `#EAB308`) |
| `2026-07-24-fix-replace-custom-budget-set-category-ids.sql` | RPC category UUID cast via `jsonb_array_elements_text` |
| `2026-07-24-category-budget-roles.sql` | `categories.budget_role` + Insurance / Cash / Savings / Investments defaults |
| `2026-07-24-reclassify-insurance-cash.sql` | Generali / Mutua → Insurance; ATM → Cash |
| `20260725000000_budget_warn_threshold_and_repeat.sql` | `custom_budgets.warn_threshold` + `repeats_monthly`; copy RPC filters on repeat and carries both. **Applied 2026-07-25 via `supabase db push --linked`** — the only migration here besides `20260723000000` that the CLI tracks (the date-named ones don't match its filename pattern and are applied with `apply-sql.mjs`). |
| `20260726000000_wealth_accounts.sql` | `wealth_accounts` + `wealth_account_movements`; partial unique index for one primary account per user |
| `20260726000001_net_worth_snapshots.sql` | `net_worth_snapshots`, `UNIQUE (user_id, as_of_date)` |
| `20260726000002_savings_withdrawals.sql` | `investment_savings_transfers.amount` relaxed from `> 0` to `<> 0` so savings can be withdrawn |
| `20260726000003_wealth_updated_at_triggers.sql` | `updated_at` trigger on `wealth_accounts`; movement trigger forcing `user_id` and inheriting the account currency |

All four applied **2026-07-26 via `supabase db push --linked`**.

Verify:

```bash
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND (column_name LIKE 'onboarding%' OR column_name IN ('wants_budget_help','primary_goals'))"
node scripts/apply-sql.mjs --project app --query "SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (proname LIKE 'household%' OR proname='liability_payment_totals') ORDER BY 1"
node scripts/apply-sql.mjs --project app --query "SELECT name, color FROM public.categories WHERE lower(btrim(name)) IN ('housing','food & dining','salary','groceries') ORDER BY 1"
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='budget_role'"
node scripts/apply-sql.mjs --project app --query "SELECT pg_get_functiondef('public.replace_custom_budget_set(integer,integer,jsonb,boolean)'::regprocedure) LIKE '%jsonb_array_elements_text%' AS uses_text_elements"
node scripts/apply-sql.mjs --project app --query "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='custom_budgets' AND column_name IN ('warn_threshold','repeats_monthly')"
node scripts/apply-sql.mjs --project app --query "SELECT table_name, count(*) AS cols FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('wealth_accounts','wealth_account_movements','net_worth_snapshots') GROUP BY 1 ORDER BY 1"
node scripts/apply-sql.mjs --project app --query "SELECT pg_get_constraintdef(con.oid) AS def FROM pg_constraint con JOIN pg_class rel ON rel.oid=con.conrelid JOIN pg_namespace n ON n.oid=rel.relnamespace WHERE n.nspname='public' AND rel.relname='investment_savings_transfers' AND con.contype='c'"
```

Expected: `net_worth_snapshots` 9 columns, `wealth_account_movements` 10,
`wealth_accounts` 16; the savings constraint reads `CHECK ((amount <> (0)::numeric))`.

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
| Locale + device default | `src/providers/locale-provider.tsx`, `src/lib/locale.ts` |
| Theme default | `src/providers/theme-provider.tsx` |
| Onboarding UI + gate | `src/components/onboarding/` |
| Onboarding logic | `src/hooks/use-onboarding.ts`, `src/lib/onboarding/` |
| Capture UI | `src/components/capture/capture-sheet.tsx`, `capture-fab.tsx` |
| Capture writes | `src/hooks/use-capture.ts` |
| Capture defaults | `src/lib/capture/defaults.ts` |
| Balance checkpoints (math + bilingual labels) | `src/lib/balance-checkpoint.ts` |
| Balance checkpoint API | `src/app/api/balance-checkpoints/route.ts` |
| Available balance settings UI | `src/components/settings/balance-checkpoint-settings.tsx` |
| Giving helpers | `src/lib/giving.ts` (`resolveGivingTarget`, `isGivingExpense`) |
| Envelope alerts (+ per-budget ladder) | `src/lib/budgeting/envelope-alerts.ts` (`resolveAlertLadder`) |
| Month-hero black chrome | `src/components/patterns/hero-surface.tsx` |
| Create / edit a budget | `src/components/budgets/budget-wizard.tsx` |
| Bare category pictogram | `CategoryGlyph` in `src/components/shared/category-badge.tsx` |
| Budget roles + method seed | `src/lib/budgeting/budget-roles.ts`, `method-seed.ts` |
| Plan write constant | `MONTHLY_PLAN_FULL_ALLOCATION` in `src/lib/validations.ts` |
| Categorization suggest / learn | `src/lib/ledger/categorize.ts`, `merchant-pattern.ts`, `api/categorization/suggest` |
| Category roles UI | `src/components/settings/category-classification.tsx` |
| Clarity palette (usage bands + cashflow + category defaults) | `src/lib/palette.ts` (`ACTIVE_PALETTE`) |
| Home | `src/components/home/home-screen.tsx`, `budget-pace-chart.tsx`, `attention-feed.tsx` |
| Stat tiles | `src/components/patterns/stat-card.tsx` (`swatchClassName`) |
| Progress meters | `src/components/patterns/progress-meter.tsx` (default = usage bands) |
| Budget | `src/components/budget/budget-screen.tsx` (reuses `BudgetPaceChart`) |
| Custom budgets hook (RPC + fallback) | `src/hooks/use-custom-budgets.ts` |
| Movements | `src/components/movements/movements-screen.tsx`, `virtualized-ledger.tsx` |
| Net worth math (pure) | `src/lib/wealth/net-worth.ts` (+ `net-worth.test.ts`, `npm run test:wealth`) |
| Net worth composition root | `src/hooks/use-net-worth.ts` (also owns the snapshot writer) |
| Accounts data | `src/hooks/use-wealth-accounts.ts` |
| Wealth API | `src/app/api/wealth/accounts/**`, `src/app/api/wealth/snapshots/` |
| Patrimonio | `src/components/wealth/wealth-overview.tsx`, `patrimonio-hero.tsx`, `net-worth-trend-card.tsx`, `assets-debts-card.tsx`, `cushion-card.tsx`, `organize-money-grid.tsx`, `wealth-breakdown-list.tsx`, `wealth-breadcrumb.tsx` |
| Accounts screen | `src/components/wealth/accounts-screen.tsx` |
| Shared wizard shell | `src/components/patterns/wizard-modal.tsx` (`WizardModal`, `useDiscardPanel`) |
| Wizard consequence rules | `src/lib/wealth/transaction-effects.ts` + `src/components/wealth/financial-impact.tsx` |
| Account wizard | `src/components/wealth/wizards/account-wizard.tsx` |
| Category page hero | `src/components/wealth/wealth-category-hero.tsx` |
| In-app confirm | `src/components/shared/confirm-dialog.tsx` |
| Patrimonio accents | `WEALTH_ACCENTS` in `src/lib/palette.ts` |
| Insights | `src/components/insights/insights-screen.tsx`, `insights-trend-charts.tsx`, `deferred-insights-trend-charts.tsx`, `monthly-report.tsx`, `calendar-screen.tsx` |
| Chart theme (incl. spend series color) | `src/components/charts/chart-theme.tsx` (`SPEND_CHART_COLOR`) |
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

## 17. Related change notes (2026-07-23 / 07-24 — Home layout & clarity palette)

Full session record: `changes/2026-07-24-document-home-budget-ui-session.md`.

- `2026-07-23-home-desktop-two-column-layout.md` — movements left; budgets + donut stacked right
- `2026-07-23-home-per-budget-rings.md` — one ring per budget + swipe pages + even grid
- `2026-07-24-clarity-palette-v2.md` — usage bands, cashflow tokens, category colors, OG switch
- `2026-07-24-budget-tab-usage-band-colors.md` — `/budget` meters share Home bands
- `2026-07-24-stat-card-color-swatch.md` — Income / Spent / Available label dots
- `2026-07-24-budget-two-column-layout.md` — Budget tab two-column + rings
- `2026-07-24-remove-primicias-card-from-budget.md` — Giving card removed from Budget
- `2026-07-24-visible-delete-monthly-income.md` — delete income control on plan card
- `2026-07-24-document-home-budget-palette-session.md` — earlier handbook sync
- `2026-07-24-document-home-budget-ui-session.md` — this chat’s full doc sync

## 18. Related change notes (2026-07-24 — balance adjustment movements)

- `2026-07-24-balance-adjustment-movements.md` — surplus/deficit booked as
  income/expense with standard EN/ES names on reconcile
- `2026-07-24-document-balance-adjustment-movements.md` — architecture + APP
  handbook sync for that behavior

## 19. Related change notes (2026-07-24 — Insights charts)

- `2026-07-24-remove-duplicate-insights-category-chart.md` — drop standalone
  category bars; keep breakdown inside monthly report
- `2026-07-24-insights-daily-spend-chart.md` — daily bars (cut at today) +
  magenta spend series color on both trend charts
- `2026-07-24-insights-chart-day-month-drilldown.md` — day → calendar sheet;
  month → Movements expenses; Recharts `activeIndex` typing
- `2026-07-24-document-insights-charts-session.md` — handbook / design /
  architecture sync for this session

## 20. Related change notes (2026-07-24 — budget simplification + roles)

Full session record:
`changes/2026-07-24-document-budget-simplification-and-roles.md`.

- `2026-07-24-remove-protected-budget-percent.md` — plan is income-only; no
  protected-% UX; `allocation_percent` always `100`
- `2026-07-24-visible-delete-monthly-income.md` — Edit + trash on plan card
- `2026-07-24-remove-primicias-card-from-budget.md` — Giving card off Budget
- `2026-07-24-remove-home-quick-actions.md` — desktop shortcut row removed
- `2026-07-24-fix-method-seed-confirm-and-rpc.md` — in-app confirm + RPC UUID fix
- `2026-07-24-budget-roles-and-smarter-categorization.md` — `budget_role`,
  method seed map, ranked suggest, merchant learn
- `2026-07-24-document-budget-simplification-and-roles.md` — this handbook sync

## 21. Related change notes (2026-07-24 — dual engines, Home filter, compact heroes)

Full session record:
`changes/2026-07-24-document-dual-engine-home-budget-session.md`.

- `2026-07-24-budget-dual-engines-mockup.md` — `kind` column + Budget mockup
  layout (Presupuestos + Metas)
- `2026-07-24-presupuestos-not-metas-ui.md` — **superseded**; briefly hid Metas
- `2026-07-24-home-presupuestos-only-metas-on-budget.md` — Home filter + restore
  Metas on `/budget` + snapshot `kind` fix
- `2026-07-24-compact-month-hero-cards.md` — denser Home + Budget heroes
- `2026-07-24-document-dual-engine-home-budget-session.md` — this handbook sync

---

*Update this file when product behavior, gating rules, or applied migrations
change. Keep `design.md` as the visual/system source of truth.*
