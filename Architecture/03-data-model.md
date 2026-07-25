# 03 — Data Model

[← Layered Architecture](02-layered-architecture.md) · [Index](README.md) · [Next: API Surface →](04-api-surface.md)

---

## 3.1 Overview

The database is a single Supabase Postgres instance (`awpygbfocmynxpadpsji`,
`eu-west-1`) holding **28 tables** in the `public` schema, all with Row Level
Security enabled, plus **14 functions** (trigger functions + RPCs). Counts
verified against the live project on 2026-07-26; the previous "25 tables / 6
functions" was stale.

Every table is owner-scoped by `user_id` referencing `auth.users(id)` with
`ON DELETE CASCADE`. The one exception is `categories`, whose `user_id` is
**nullable** — a NULL owner marks a global default category shared by all users.

TypeScript mirrors the schema in [`src/types/database.ts`](../src/types/database.ts)
(1,194 lines) exposing `Row`, `Insert`, and `Update` shapes per table. Every query
in the application is typed through it.

### Domain grouping

```
                          auth.users
                              │ (trigger: handle_new_user)
                              ▼
                          profiles ──────────────┐
                              │                  │ base_currency,
                              │                  │ tithe_target_percent,
                              │                  │ onboarding_*, primary_goals
    ┌─────────────────────────┼──────────────────┴───────────────┐
    │                         │                                  │
 CORE LEDGER              BUDGETING                          WEALTH
 ───────────              ─────────                          ──────
 categories ◀──┐          budgets ────────▶ categories       brokerage_accounts
 expenses  ────┤          monthly_budget_plans                 └─ investment_assets
 income_entries┘          custom_budgets                       └─ investment_trades
                            └─ custom_budget_categories        └─ investment_cash_movements
                          recurring_expenses                   investment_watchlist
                                                               investment_savings_accounts
 IMPORT                   RECONCILIATION                         └─ investment_savings_transfers
 ──────                   ──────────────                       market_price_history
 import_batches           balance_checkpoints
 categorization_rules                                        DEBT & RECEIVABLES
                                                             ──────────────────
                                                             liabilities
                                                               └─ liability_payments
                                                             loans ──▶ expenses
                                                               └─ loan_repayments ──▶ income_entries
                                                             loan_people
```

---

## 3.2 Core ledger

### `profiles`

Auto-provisioned for every new auth user by the `handle_new_user` trigger. This
is the user-settings table; it has accumulated columns across five migrations.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | → `auth.users(id)` CASCADE |
| `display_name`, `avatar_url` | TEXT | |
| `base_currency` | TEXT NOT NULL DEFAULT `'EUR'` | Drives all display conversion |
| `manual_fx_rates` | JSONB | User overrides for FX rates, merged over live rates |
| `tithe_target_percent` | NUMERIC | Giving target as a % of income |
| `onboarding_completed_at` | TIMESTAMPTZ | NULL until wizard finished |
| `onboarding_skipped_at` | TIMESTAMPTZ | NULL until skipped |
| `wants_budget_help` | BOOLEAN | Drives method + envelope seeding |
| `primary_goals` | TEXT[] DEFAULT `'{}'` | 7 allowed values, see [06](06-domain-logic.md#65-onboarding-personalization) |
| `created_at`, `updated_at` | TIMESTAMPTZ | `created_at` gates the onboarding rule |

`created_at` is load-bearing: the onboarding force-gate applies only to profiles
created on or after `2026-07-18T00:00:00.000Z`, so pre-existing accounts are never
redirected into the wizard.

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID **NULL** | NULL ⇒ global default category |
| `name` | TEXT NOT NULL | Stored in English; translated at render by `tc()` |
| `icon` | TEXT DEFAULT `'circle'` | lucide icon name |
| `color` | TEXT DEFAULT `'#6366f1'` | The one sanctioned dynamic color |
| `is_default` | BOOLEAN | |
| `classification` | TEXT NOT NULL DEFAULT `'discretionary'` | CHECK: `essential` \| `discretionary` \| `giving` \| `savings` |
| `budget_role` | TEXT NOT NULL | Closed vocabulary for method seeding (e.g. `housing`, `tithe`, `loan_lent`, `income`) — see `src/lib/budgeting/budget-roles.ts` |
| `applies_to` | TEXT | `expense` \| `income` \| `both` — which ledger side the category appears on |

`classification` was added 2026-07-03 with a bilingual name-matching seed pass
(`ILIKE '%housing%' OR '%vivienda%'` → essential; `'%tithe%' OR '%diezmo%'` →
giving, and so on). It drives the Insights pillars, liquidity views, and giving
detection.

`budget_role` (2026-07-24) is the finer key for **which method envelope** a
category joins. Stewardship `classification` alone is too coarse (e.g. Loan is
not “savings”; Insurance is not generic “essentials” for Base cero housing).
`loan_lent` marks money **you** lend (Wealth → Loans), never personal debt
payoff. Income categories use `income` and are excluded from spend seeds.

Category names are **stored in English and translated for display**. The
translation index in [`lib/constants.ts`](../src/lib/constants.ts) is keyed on an
accent-stripped, lowercased name and supports aliases — `"Tithe / Diezmo"` maps to
the same entry as `"Tithe"`, which matters because the import pipeline creates the
former.

### `expenses`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID NOT NULL | CASCADE |
| `category_id` | UUID NOT NULL | → `categories(id)` **RESTRICT** |
| `amount` | DECIMAL(12,2) CHECK > 0 | Always positive; direction is implied by the table |
| `currency` | TEXT DEFAULT `'EUR'` | **Original** currency, never converted at rest |
| `description` | TEXT | Normalized on import; participates in the dedupe key |
| `date` | DATE NOT NULL | |
| `source_kind` | TEXT NOT NULL DEFAULT `'manual'` | `manual` \| `import` \| `recurring` |
| `external_ref` | TEXT | Bank reference for import idempotency |
| `import_batch_id` | UUID | Enables batch rollback |
| `needs_review` | BOOLEAN DEFAULT false | Feeds the Review queue |
| `recurring_expense_id`, `recurring_month` | | Links materialized recurring charges |
| `created_at`, `updated_at` | TIMESTAMPTZ | `created_at` is a checkpoint tiebreak — **must be server-generated** |

Indexes: `user_id`, `date`, `category`, plus partial indexes on
`needs_review` and `import_batch`.

The `ON DELETE RESTRICT` on `category_id` is deliberate — deleting a category that
has expenses fails rather than orphaning or cascading away financial history.

### `income_entries`

Mirrors `expenses` with two differences: `source` (TEXT, required, 1–100 chars)
replaces the mandatory category, and `category_id` is **optional** (added later so
income can be categorized as Salary, Loan repayment, etc.).

The asymmetry is a product rule, enforced in the capture form: *income requires a
Source; expense requires a Category*.

---

## 3.3 Budgeting

The app supports **two coexisting budget models**, which is a genuine source of
conceptual complexity.

### `budgets` — per-category limits (the original model)

`UNIQUE(user_id, category_id, month, year)`. One amount per category per month.

### `monthly_budget_plans` — monthly income

| Column | Notes |
|---|---|
| `income_amount` DECIMAL(12,2) > 0 | Planned monthly income |
| `income_currency` | |
| `allocation_percent` DECIMAL(5,2) | NOT NULL, 0 < x ≤ 100. **Product always writes `100`** (`MONTHLY_PLAN_FULL_ALLOCATION`). Legacy “protected %” UX removed 2026-07-24; column kept for NOT NULL / older rows. |
| `UNIQUE(user_id, month, year)` | One plan per month |

Product model: the plan is **expected income**, not a second savings system.
Named envelopes (`custom_budgets`) own the spend split. UI totals prefer the sum
of envelope limits when they exist. Older pool math
(`income × allocation_percent / 100`) still exists in
`calculateBudgetPoolMetrics` for compatibility when envelopes are absent.

### `custom_budgets` — envelopes (Presupuestos + Metas)

| Column | Notes |
|---|---|
| `name` | 1–120 chars, `UNIQUE(user_id, name, month, year)` |
| `kind` | `spending_limit` (Presupuesto / ceiling) \| `contribution_goal` (Meta / floor). Default `spending_limit`. Seeded from category roles / method slices. |
| `amount_type` | CHECK `fixed` \| `percentage` |
| `amount_value` DECIMAL(12,2) > 0 | Either an amount or a % of plan income |
| `currency` | CHECK length 3 |
| `month`, `year` | |
| `warn_threshold` | NULL → the default 75/90/100 alert ladder; 50–99 (CHECK) → warn once there, then again at 100%. Read by `resolveAlertLadder()` in `envelope-alerts.ts`. Limits only — the wizard hides it for Metas. |
| `repeats_monthly` | Default **true**. `copy_custom_budgets_from_previous_month` filters on it, so an unchecked budget is left behind when the user copies a month. |

Joined to categories through `custom_budget_categories`
(`UNIQUE(custom_budget_id, category_id)`), so one envelope can span several
categories — "Lifestyle" covering Entertainment + Shopping + Travel, for example.

**Nothing stops two envelopes claiming the same category**, and that overlap is
not handled downstream — see [Known gaps](#known-gaps-envelope-overlap) below.
There is no `parent_id`; envelopes are a flat list, so a "Gastos de vida" that
conceptually contains Vivienda and Transporte is a *sibling* of them, not a
parent.

**Placement:** Home’s Presupuestos carousel filters to `spending_limit` only.
Metas (`contribution_goal`) render on `/budget`. The month snapshot RPC must
include `kind` (`2026-07-24-month-snapshot-budget-kind.sql`); client
`resolveBudgetKind()` infers from linked categories if the field is absent.

**Why two models coexist:** `budgets` predates the envelope rework.
`calculateBudgetPoolMetrics` still reads `budgets` to compute
`assignedCategoryBudgetTotal` and `isOverAssigned`, while the UI now surfaces
`custom_budgets`. Both are live. See
[10 — Assessment](10-architectural-decisions.md#risk-1-two-budget-models).

<a id="known-gaps-envelope-overlap"></a>
**Known gap — envelope overlap double-counts (unfixed, 2026-07-25).** When one
category belongs to two envelopes, its spend is counted once per envelope:

- `budget-screen.tsx` sums `totalConsumed` per envelope, then derives
  `unallocatedSpent = monthTotalSpent − totalConsumed`. Double-counted spend
  inflates `totalConsumed`, so the value clamps at `0` and **hides genuinely
  unallocated spending**.
- `planSlices` / plan distribution allocate the same euros twice, overstating
  how much of income is committed.

The create wizard warns at selection time (naming the other envelope) but does
not prevent it, and existing overlaps and edits bypass the warning entirely.
The aggregation needs fixing regardless of whether parent/child envelopes are
ever added.

### `recurring_expenses`

Templates with `charge_day` (1–31), `start_date`, `is_active`. Materialized into
concrete `expenses` rows by `syncRecurringExpensesForMonth`, triggered by
`POST /api/recurring/sync` when the selected month changes.

---

## 3.4 Import

### `import_batches`

| Column | Notes |
|---|---|
| `source_format` | CHECK `santander_csv` \| `wise_csv` |
| `filename` | |
| `status` | CHECK `pending` \| `committed` \| `rolled_back` \| `discarded` |
| `rows` | **JSONB** — the full proposal, including per-row status and overrides |
| `new_count`, `duplicate_count`, `uncategorized_count` | Denormalized counters |
| `committed_at` | |

Storing the entire proposal as JSONB is what makes the review-then-commit flow
possible without a staging table: the batch is a self-contained document the user
edits before it becomes ledger rows.

### `categorization_rules`

| Column | Notes |
|---|---|
| `match_type` | CHECK `merchant_keyword` \| `bank_category` |
| `pattern` | Normalized (accent-stripped, lowercased) match string |
| `category_id` | CASCADE |
| `priority` | INTEGER DEFAULT 100 — lower wins |
| `source` | CHECK `seed` \| `user` |
| `UNIQUE(user_id, match_type, pattern)` | |

Seeded from `scripts/generate_categorization_rules_seed.py`; users add their own
through the import review UI.

---

## 3.5 Reconciliation — `balance_checkpoints`

The most carefully constrained table in the schema.

```sql
CREATE TABLE public.balance_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(18, 2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
    as_of_date DATE NOT NULL,
    calculated_balance_before NUMERIC(18, 2),
    reconciliation_delta NUMERIC(18, 2),
    calculation_start_date DATE,
    calculation_basis TEXT CHECK (
        calculation_basis IS NULL OR
        calculation_basis IN ('monthly_net', 'tracked_balance')
    ),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 240),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT balance_checkpoint_reconciliation_consistent CHECK (…)
);
```

The table-level CHECK enforces an all-or-nothing rule: either the audit fields
(`calculated_balance_before`, `reconciliation_delta`, `calculation_start_date`,
`calculation_basis`) are all NULL, or they are all present **and**
`reconciliation_delta = balance - calculated_balance_before`.

A `BEFORE INSERT` trigger (`enforce_balance_checkpoint_insert`) forces
`user_id = auth.uid()` and server-generated `created_at` for authenticated
inserts — required for same-day movement ordering against the checkpoint.

Index `idx_balance_checkpoints_latest` supports the hot query: the most recent
checkpoint at or before a target date, ordered by `as_of_date DESC, created_at DESC`.

**Companion ledger write (no schema change).** Since 2026-07-24,
`POST /api/balance-checkpoints` also books a non-zero `reconciliation_delta` as
a normal `income_entries` (surplus) or `expenses` (deficit) row dated
`as_of_date`, using standard bilingual labels from
`src/lib/balance-checkpoint.ts`. The movement is inserted *before* the
checkpoint so it is not counted again in post-checkpoint tracked balance.
The historical column comment on `reconciliation_delta` (“never ledger income”)
describes the checkpoint audit field itself; the product now *also* surfaces
the delta in the ledger. See [06 §6.4](06-domain-logic.md#reconciliation-delta-is-audited-and-booked).

---

## 3.6 Wealth

Eight tables model the investing surface:

| Table | Purpose |
|---|---|
| `brokerage_accounts` | Broker name, kind, currency |
| `investment_assets` | Ticker/ISIN, asset type, market code, quote currency |
| `investment_trades` | Buy/sell with quantity, price, fees |
| `investment_cash_movements` | Deposit/withdrawal into broker cash |
| `investment_watchlist` | Tracked-but-unowned symbols |
| `investment_savings_accounts` | Bank savings (country, bank, product type, account name, currency). **No APR column exists** — `interest_rate_percent` lives only on `liabilities`. |
| `investment_savings_transfers` | Deposits/withdrawals to savings |
| `market_price_history` | Cached quotes keyed by asset lookup |

`investment_savings_transfers` also feeds the **balance calculation**: transfers
out of the checking account reduce the tracked balance, which is why
`calculateTrackedBalance` subtracts `investmentTransfers` alongside expenses.

### Debt and receivables

| Table | Purpose |
|---|---|
| `liabilities` | Debts owed: kind (`loan`/`mortgage`/`credit_card`/`personal`/`other`), original balance, interest rate |
| `liability_payments` | Payments against a liability |
| `loans` | Money **lent to people**: `borrower_name`, `principal`, `lent_date`, `is_active`, `expense_id` |
| `loan_repayments` | Repayments received: linked to `income_entry_id` |
| `loan_people` | Reusable borrower names for the picker |

The `loans.expense_id → expenses(id) ON DELETE SET NULL` and
`loan_repayments.income_entry_id → income_entries(id) ON DELETE SET NULL` foreign
keys implement the **dual-write** design: lending money creates both a loan record
(Wealth) and a Loan-category expense (Movements), linked. `SET NULL` rather than
CASCADE means deleting the movement leaves the loan intact but unlinked — the
receivable survives a ledger cleanup.

### Accounts and net-worth history (added 2026-07-26)

| Table | Purpose |
|---|---|
| `wealth_accounts` | Cuentas y efectivo: `kind` (checking/savings/cash/digital_wallet/other), `name`, `institution`, `currency`, `opening_balance`, `opening_date`, `include_in_available`, `is_primary`, `color`, `icon`, `notes`, `status` |
| `wealth_account_movements` | Signed balance deltas: `movement_type` (opening_balance/transfer_in/transfer_out/adjustment), `amount` (`<> 0`), `occurred_on`, `linked_account_id` |
| `net_worth_snapshots` | Daily history: `as_of_date`, `base_currency`, `total_assets`, `total_liabilities`, `net_worth`, `breakdown` jsonb |

Three design points worth knowing:

1. **Account balance is derived, never stored** — `opening_balance + Σ movements`.
   This matches `liabilities` (`original_balance − Σ payments`) and `loans`
   (`principal − Σ repayments`), so all three read the same way.
2. **`UNIQUE (user_id, as_of_date)` on snapshots is the once-a-day rule.** The
   writer upserts, so a duplicate request updates rather than appending. A
   partial unique index `(user_id) WHERE is_primary` likewise makes "one primary
   account" structural rather than enforced in application code.
3. **`enforce_wealth_account_movement`** (BEFORE INSERT OR UPDATE) forces
   `user_id` from `auth.uid()` and inherits `currency` from the parent account,
   raising `42501` if the account is not the caller's. One account has one
   currency, so a movement can never introduce an FX event of its own.

**Relationship to `balance_checkpoints`.** Checkpoints stay the reconciliation
tool and are **not** summed into `totalAssets`, so net worth is not
double-counted. `wealth_accounts.is_primary` exists so the Settings
reconciliation can later target a real account; until then the app can present
two different figures for liquid cash.

Also changed: `investment_savings_transfers.amount` was relaxed from
`CHECK (amount > 0)` to `CHECK (amount <> 0)`. Savings previously could only
ratchet up — there was no withdrawal path in the schema, the API or the UI —
which a balance sheet cannot support. Negative now means a withdrawal, mirroring
`liability_payments.amount`.

---

## 3.7 Security model

### Row Level Security

All 28 tables run `ENABLE ROW LEVEL SECURITY` with policies of the form:

```sql
CREATE POLICY "Users can view own loans"
    ON public.loans FOR SELECT USING (auth.uid() = user_id);
```

with matching INSERT / UPDATE / DELETE policies. `categories` additionally permits
reading rows where `user_id IS NULL` (global defaults).

### The critical caveat

**API routes bypass RLS.** They authenticate the user, then query with the
service-role client, filtering explicitly by `user_id`:

```ts
const supabase = ledgerSupabase ?? appSupabase;      // service-role if configured
const effectiveUserId = ledgerUser?.id ?? user.id;

supabase.from("expenses").select(…).eq("user_id", effectiveUserId)
```

RLS is therefore the **second** line of defense for API traffic — it protects
direct browser-client queries (providers, auth forms) and would contain damage
from a compromised anon key, but it does not protect against a missing `.eq()`
in a route handler. Any new route must filter by user id explicitly. This is the
single most important invariant for a contributor to internalize.

### Functions

| Function | Type | Purpose |
|---|---|---|
| `handle_new_user` | Trigger on `auth.users` | Creates the `profiles` row on signup |
| `update_updated_at` | Trigger | Maintains `updated_at` across tables |
| `enforce_balance_checkpoint_insert` | BEFORE INSERT trigger | Server-side checkpoint consistency |
| `household_expense_category_aggregates` | RPC | 12-month category totals for Insights |
| `household_income_aggregates` | RPC | 12-month income totals |
| `liability_payment_totals` | RPC | Payment sums per liability |

The three RPCs exist purely for performance: they replace paginated row fetches
with a single server-side aggregate. `/api/insights/household` calls them and
**falls back to paginated row scanning** if they are absent — the missing-table
tolerance pattern again.

---

## 3.8 Migration history

Migrations are plain SQL applied manually via
`node scripts/apply-sql.mjs --project app --file <path>`. There is no migration
runner, no version table, and no automatic ordering — the filename date is the
only sequencing.

| Date | Migration | Adds |
|---|---|---|
| — | `migration.sql` | Base schema: profiles, categories, expenses, income_entries, budgets, plans, RLS, triggers |
| 2026-04-01 | `investment-savings-accounts` | Savings accounts + transfers |
| 2026-04-01 | `recurring-monthly-charges` | `recurring_expenses` |
| 2026-04-04 | `sync-feature-tables-and-postgrest-cache` | Schema-cache reload fixes |
| 2026-04-07 | `custom-budgets` | Envelopes + category join |
| 2026-07-03 | `category-classification` | `classification` + bilingual seed pass |
| 2026-07-03 | `ledger-import-foundations` | `source_kind`/`external_ref`/`import_batch_id`/`needs_review` on both ledgers, `import_batches`, `categorization_rules` |
| 2026-07-03 | `profile-settings-liabilities` | `liabilities`, `liability_payments`, profile settings |
| 2026-07-03 | `seed-categorization-rules` | Seed rule data |
| 2026-07-18 | `balance-checkpoints` | Checkpoint table + trigger |
| 2026-07-18 | `household-insights-aggregates-app` | `liability_payment_totals` |
| 2026-07-18 | `household-insights-aggregates-ledger` | Household RPCs |
| 2026-07-18 | `onboarding-goals` | Profile onboarding columns |
| 2026-07-22 | `loans-receivables` | `loans`, `loan_repayments` |
| 2026-07-22 | `loan-category` | Loan category + banknote icon |
| 2026-07-22 | `income-categories-loan-people` | `income_entries.category_id`, `loan_people` |
| 2026-07-24 | `palette-v2-category-colors` | Clarity category hex update by known EN/ES names (Housing yellow `#EAB308`) |
| 2026-07-24 | `fix-replace-custom-budget-set-category-ids` | RPC uses `jsonb_array_elements_text` so category UUIDs cast correctly |
| 2026-07-24 | `category-budget-roles` | `categories.budget_role` + Insurance / Cash / Savings / Investments defaults |
| 2026-07-24 | `reclassify-insurance-cash` | Generali / Mutua → Insurance; ATM → Cash |
| 2026-07-24 | `custom-budget-kinds` | `custom_budgets.kind` (`spending_limit` \| `contribution_goal`) + copy/seed RPCs |
| 2026-07-24 | `month-snapshot-budget-kind` | `prepare_month_snapshot` includes `custom_budgets.kind` |
| 2026-07-23 | `20260723000000_performance_data_contracts` | `get_app_bootstrap`, `prepare_month_snapshot`, `get_household_insights` |
| 2026-07-25 | `20260725000000_budget_warn_threshold_and_repeat` | `custom_budgets.warn_threshold` + `repeats_monthly` |
| 2026-07-26 | `20260726000000_wealth_accounts` | `wealth_accounts` + `wealth_account_movements` |
| 2026-07-26 | `20260726000001_net_worth_snapshots` | `net_worth_snapshots` |
| 2026-07-26 | `20260726000002_savings_withdrawals` | Savings transfers may be negative |
| 2026-07-26 | `20260726000003_wealth_updated_at_triggers` | `updated_at` + movement guard triggers |

**Two filename conventions, two apply paths.** Date-named files
(`2026-07-24-*.sql`) do **not** match the Supabase CLI's
`<timestamp>_name.sql` pattern, so `supabase db push` silently *skips* them —
they are applied by hand with `apply-sql.mjs` and are invisible to
`supabase migration list`. Timestamp-named files are CLI-tracked and applied
with `supabase db push --linked`. New migrations should use the timestamp form.

Several migrations carry headers reading *"Apply to BOTH Supabase projects"* — an
artifact of the retired two-project era. Those instructions are now obsolete but
were left in place as historical record; see [10](10-architectural-decisions.md#ad-1-the-ledger-bridge-and-its-ghost).

---

[← Layered Architecture](02-layered-architecture.md) · [Index](README.md) · [Next: API Surface →](04-api-surface.md)
