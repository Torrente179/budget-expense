# 06 — Domain Logic

[← Frontend Architecture](05-frontend-architecture.md) · [Index](README.md) · [Next: Import Pipeline →](07-import-pipeline.md)

---

This is where the product's actual rules live: 35 modules in `src/lib/`, all pure
functions with no React dependency, all receiving `convert` by parameter rather
than importing currency context.

---

## 6.1 Budget mathematics

[`src/lib/budgeting.ts`](../src/lib/budgeting.ts)

### The pool

```
pool = plan.income_amount × (plan.allocation_percent / 100)     … when a plan exists
pool = Σ per-category budgets                                    … when it does not
```

`calculateBudgetPoolMetrics` returns eleven derived numbers from four inputs
(plan, budgets, expenses, convert):

| Metric | Meaning |
|---|---|
| `poolAmount` | The spendable pool for the month |
| `consumedAmount` | Sum of converted expenses |
| `remainingAmount` | `pool − consumed` (may be negative) |
| `consumedPercent` | Guarded against divide-by-zero |
| `assignedCategoryBudgetTotal` | Sum of per-category budgets |
| `unassignedAmount` | `pool − assigned` — how much of the pool is unplanned |
| `isOverAssigned` | Assigned exceeds the pool |
| `hasPlan` | Whether a plan exists at all |

Every currency-bearing input passes through the injected `convert`, so the math is
base-currency-agnostic.

### Envelopes (custom budgets)

```ts
resolveCustomBudgetAmount(budget, incomeAmount, convert)
  // percentage → incomeAmount × (amount_value / 100), 0 if no income
  // fixed      → convert(amount_value, budget.currency)
```

Envelope spending sums only expenses in the envelope's linked categories.
`budgetUsageRatio` encodes a deliberate edge case:

```ts
if (limit > 0) return spent / limit;
if (spent > 0) return Number.POSITIVE_INFINITY;   // spend against a zero limit
return 0;
```

Spending against a zero limit is *infinitely* over budget, not undefined — so it
sorts to the top of alert lists and renders as over rather than silently as 0%.

### UI usage bands (Home rings + Budget meters)

Visual progress on Home and `/budget` uses a **five-band palette** driven by
`spent / limit` alone (not calendar pace), defined in
[`palette.ts`](../src/lib/palette.ts) (`resolveBudgetUsageTone`):

| Band | Ratio |
|---|---|
| Safe | &lt; 70% |
| Watch | 70–84% |
| Near limit | 85–99% |
| Exceeded | 100–119% |
| Critical | ≥ 120% |

These bands are independent of the toast/Attention thresholds in §6.2 (75 / 90 /
100). Category-colored rings were rejected so the usage signal stays primary.
Flip `ACTIVE_PALETTE` to `"og"` for the previous three-tone semantic mapping.

---

## 6.2 Envelope limit alerts

[`envelope-alerts.ts`](../src/lib/budgeting/envelope-alerts.ts) ·
[`notify-envelope-limits.ts`](../src/lib/budgeting/notify-envelope-limits.ts)

Three thresholds: **75% warn · 90% danger · 100% over**. `highestThreshold`
returns only the most severe band reached, so one envelope never fires three
alerts.

Alerts surface in two places:

1. **After expense capture** — `useCapture.onSuccess` calls
   `notifyEnvelopeLimitsAfterExpense`, which refetches the affected month's
   envelopes and expenses and fires a Sonner toast with the envelope name and
   percentage, actioned to `/budget`.
2. **Home Attention feed** — rows for every envelope ≥75% this month.

Deduplication uses `sessionStorage` under `be-envelope-alert-toasts`, keyed
`${budgetId}:${threshold}` — one toast per envelope per threshold per browser
session. The implementation fails **open**:

```ts
try { … } catch { return true; }   // storage blocked → still show the alert
```

Private-browsing users get a possibly repeated alert rather than none. For a
financial warning, that is the correct failure direction.

There is deliberately **no push or email**. All alerts are in-app.

---

## 6.3 Giving — the income invariant

[`src/lib/giving.ts`](../src/lib/giving.ts)

The single most emphasized rule in the product:

> Giving is a **share of income**, never a mirror of total expenses.

```ts
export function resolveGivingTarget(input: {
  tithePercent: number;
  planIncome: number | null | undefined;
  recordedIncome: number | null | undefined;
}): number {
  if (!(input.tithePercent > 0)) return 0;
  const incomeBase =
    input.planIncome != null && input.planIncome > 0 ? input.planIncome
    : input.recordedIncome != null && input.recordedIncome > 0 ? input.recordedIncome
    : 0;
  if (!(incomeBase > 0)) return 0;
  return incomeBase * (input.tithePercent / 100);
}
```

Plan income is preferred over recorded income because the plan represents intent
for the whole month, whereas recorded income mid-month is incomplete — targeting
10% of income-so-far would make the target creep upward with each paycheck.

Detection of giving *expenses* is three-tiered, in order:

1. `categories.classification === "giving"` (explicit, user-controlled)
2. Category name matches a keyword
3. Description matches a keyword

The keyword list is bilingual and ecumenical: `tithe`, `diezmo`, `giving`,
`donation`, `donación`, `charity`, `caridad`, `offering`, `ofrenda`, `church`,
`iglesia`, `generosity`, `generosidad`, `tzedakah`.

In the UI, the **primary number is the target**, with the amount given shown as
detail — reinforcing that giving is a commitment to meet, not an outcome to report.

---

## 6.4 Balance checkpoints

[`src/lib/balance-checkpoint.ts`](../src/lib/balance-checkpoint.ts) — the only
unit-tested module (`npm run test:balance`).

The problem: a ledger accumulates drift. Rather than trusting a running total from
inception, the user periodically records the **real** bank balance, and the app
replays only what happened since.

```
trackedBalance = convert(checkpoint.balance)
               + Σ incomes after checkpoint
               − Σ expenses after checkpoint
               − Σ investment transfers after checkpoint
```

### Three details that make it correct

**1. "After" needs a tiebreak.** A movement dated the same day as the checkpoint
may or may not be included in it:

```ts
if (movement.date > checkpoint.as_of_date) return true;
if (movement.date < checkpoint.as_of_date) return false;
return Date.parse(movement.created_at) > Date.parse(checkpoint.created_at);
```

The doc comment records the consequence: *"`created_at` must therefore be
generated by the server."* A client-supplied timestamp would make same-day
ordering unreliable and silently corrupt the balance.

**2. Integer cents.** Aggregation converts to cents, sums as integers, divides
back:

```ts
const cents = Math.round(amount * 100);
centsByCurrency.set(currency, (centsByCurrency.get(currency) ?? 0) + cents);
```

Summing thousands of two-decimal floats accumulates binary-representation error;
integer cents eliminates it.

**3. Currency is aggregated before conversion.** Totals are grouped per currency
first, then converted once per currency — not converted per row. Fewer floating
operations, and the intermediate totals remain auditable in their original
currency.

### Reconciliation delta is audited *and* booked

When a checkpoint is recorded, the difference between the real bank balance and
the calculated one is stored as `reconciliation_delta` on the checkpoint row
(still enforced by the table CHECK and `BEFORE INSERT` trigger). As of
2026-07-24, a **non-zero** delta is also booked as a ledger movement on
`as_of_date`:

| Delta | Movement | Standard name (EN / ES) |
|---|---|---|
| `> 0` (surplus) | `income_entries` | Opening / Reconciliation **surplus** · Superávit… |
| `< 0` (deficit) | `expenses` | Opening / Reconciliation **deficit** · Déficit… |
| `0` | none | — |

Label selection lives in `getBalanceAdjustmentLabel()`:

- Opening path (`calculation_basis = monthly_net`) → opening surplus/deficit
- Tracked path (`calculation_basis = tracked_balance`) → reconciliation surplus/deficit

**Ordering invariant.** `POST /api/balance-checkpoints` inserts the adjustment
movement **before** the checkpoint so same-day `created_at` ordering keeps the
movement inside the checkpoint baseline. Tracked available cash therefore does
not double-count the delta. If the checkpoint insert fails, the movement is
deleted (best-effort rollback).

**Display.** Canonical English (and, for expenses, `EN / ES`) is stored on the
row; Movements and Calendar call `translateBalanceAdjustmentName()` so the
active locale shows the matching Spanish or English label.

---

## 6.5 Onboarding personalization

[`goals.ts`](../src/lib/onboarding/goals.ts) ·
[`personalize.ts`](../src/lib/onboarding/personalize.ts) ·
[`apply.ts`](../src/lib/onboarding/apply.ts)

Seven goals: `save_more`, `increase_wealth`, `budget_tracking`,
`decrease_expenses`, `pay_debt`, `give_generously`, `build_emergency_fund`.

`buildPersonalization` is a **pure, deterministic** function mapping answers to a
plan. Method selection is an explicit priority ladder:

```
user-picked methodId          → wins outright
pay_debt OR has debts         → 60-30-10
give_generously               → 5-jars
save_more | emergency fund    → pay-yourself-first
decrease_expenses             → 50-30-20
increase_wealth               → pay-yourself-first
default                       → 50-30-20
```

The `methodId` override is the interesting part: the suggestions step pre-selects
a goal-derived method but lists all of them, and once the user picks another, that
choice is sticky **even if they go back and change their goals**. Respecting an
explicit choice over an inference is the same principle as the locale provider's
explicit-preference flag.

Goals also produce seed envelopes (Essentials 50%, Lifestyle 30% or 20% if
decreasing expenses, Savings 20%, Giving 10%), Home CTAs, and Attention hints.

`applyOnboardingPersonalization` writes it all at finish: monthly plan, recurring
charges, liabilities, seed envelopes, and — for `give_generously` — sets
`tithe_target_percent` to 10% *and ensures a Tithe/Diezmo category exists*, so the
Giving envelope never binds to essentials or lifestyle categories.

### The gate

Two independent checks share one rule and one cache key:

| Check | Where | Authority |
|---|---|---|
| Server | `lib/supabase/middleware.ts` | Redirects on `/login` and `/signup` |
| Client | `OnboardingGate` in `(app)/layout` | Soft redirect from any app route |

The rule: profiles created on or after `ONBOARDING_FEATURE_LAUNCH`
(`2026-07-18T00:00:00.000Z`) with **neither** `onboarding_completed_at` nor
`onboarding_skipped_at`. Pre-existing accounts are never gated.

A documented bug is instructive here. Skip used to bounce back into the wizard
because the gate and wizard held separate local state. The fix was threefold:
a shared React Query key (`queryKeys.onboardingProfile`), an optimistic cache
update on skip, and a `sessionStorage` flag (`be-onboarding-dismissed`) checked by
the gate before redirecting. It is a clean illustration of why the central key
factory matters.

---

## 6.6 Loans — the dual-write pattern

[`loans/ledger.ts`](../src/lib/loans/ledger.ts) ·
[`loans/is-loan-category.ts`](../src/lib/loans/is-loan-category.ts) ·
[`loans/people.ts`](../src/lib/loans/people.ts)

Lending money to a person is simultaneously two things: cash leaving the account
(a movement) and an asset created (a receivable). The app records both and links
them.

```
User picks the "Loan / Préstamo" category in CaptureSheet
  └─ isLoanCategoryName() → sheet switches to loan mode, asks for a borrower
       └─ useCapture.addLoan()
            └─ POST /api/loans { borrower_name, principal, lent_date,
                                 movement_description, create_movement: true }
                 ├─ INSERT loans
                 ├─ INSERT expenses (Loan category)  ← the movement
                 ├─ loans.expense_id = expense.id    ← the link
                 └─ upsertLoanPerson()               ← remember the borrower
```

Repayment is the mirror image: `POST /api/loans/[id]/repayments` inserts a
`loan_repayments` row and a linked `income_entries` row, updating loan state.

Both foreign keys are `ON DELETE SET NULL`, so deleting the movement unlinks
rather than destroying the receivable.

Undo is handled explicitly: the loan toast's Undo action calls
`DELETE /api/loans/:id?delete_expense=1` so both halves disappear together.

`resolveLoanCategoryId` prefers the **global** Loan category (`user_id IS NULL`)
and falls back to any category named "loan", so the dual-write works whether or not
a user has created their own.

---

## 6.7 Investments

[`src/lib/investments.ts`](../src/lib/investments.ts) — the largest domain module.

It defines the catalogs (brokers, savings banks by country, product types), the
type unions (`AssetType`, `MarketCode`, `TradeSide`, `MovementType`, `FeeMode`),
the row and join types, and the aggregation:

```ts
buildInvestmentOverview({ … }) → {
  holdings: HoldingSummary[],       // quantity, cost basis, market value, P&L
  accountCash: AccountCashSummary[],
  totals…
}
```

`buildAssetKey` and `normalizeInvestmentAsset` canonicalize identity across market
codes and ticker formats — the same instrument bought on two exchanges must
aggregate correctly. `estimateTradeFee` models broker fee structures via `FeeMode`.

Wealth's net-worth number is the sum of holdings market value, savings balances,
and broker cash, with liabilities shown separately rather than netted — a
presentation choice consistent with "everything owned and owed".

---

## 6.8 Anomaly detection

[`insights/anomalies.ts`](../src/lib/insights/anomalies.ts)

`detectAnomalies` compares each category's current-month spending against its own
recent monthly average and flags sharp deviations. Results surface as "Heads up"
in Insights and as rows in the Home Attention feed.

The design keeps it per-category rather than global: a €400 flight is normal for
Travel and alarming for Groceries.

---

## 6.9 Content modules

Two modules hold localized editorial content rather than logic:

- [`financial-wisdom.ts`](../src/lib/financial-wisdom.ts) — money tools and
  principles, EN/ES.
- [`biblical-wisdom.ts`](../src/lib/biblical-wisdom.ts) — stewardship passages,
  themes, and translation sources.
- [`budgeting-methods.ts`](../src/lib/budgeting-methods.ts) — the method catalog
  (50-30-20, 60-30-10, 5-jars, pay-yourself-first…) with allocation slices and
  principles. This one is dual-purpose: it renders in Wisdom *and* drives
  onboarding suggestions and the Budget method picker.

Keeping content as typed TypeScript rather than a CMS or JSON keeps it
type-checked, searchable, and reviewable in the same pull request as the code that
renders it — appropriate for a single-author product.

---

[← Frontend Architecture](05-frontend-architecture.md) · [Index](README.md) · [Next: Import Pipeline →](07-import-pipeline.md)
