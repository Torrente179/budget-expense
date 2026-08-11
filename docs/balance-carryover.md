# Available balance carryover contract

This document is the canonical product and engineering contract for the amount
shown as **You have / Te quedan** on Home. It explains what carries between
months, what deliberately resets each month, how the value is calculated, and
how to verify or troubleshoot it.

Implemented on 2026-08-11 in commit `5956be7`. See
[`changes/2026-08-11-carry-available-balance-across-months.md`](../changes/2026-08-11-carry-available-balance-across-months.md)
for the implementation record.

---

## 1. Product contract

Home answers **how much cash is available now**. When balance tracking is active,
that amount is continuous across calendar months:

1. Start from the latest real bank-balance checkpoint at or before the target
   date.
2. Add every later income up to the target date.
3. Subtract every later expense up to the target date.
4. Subtract every later investment/savings transfer up to the target date.
5. Use the result for Home's headline and daily guide.

There is no July-to-August copy, rollover row, scheduled job, or database
mutation. Carryover is a **projection from one continuous ledger**. July's
closing cash is automatically August's opening cash because the calculation
does not reset at the month boundary.

The monthly budget remains separate. Its income, spending, percentage, pace,
and remaining amount describe only the selected month's plan.

---

## 2. Do not conflate these figures

| Figure | Current formula | Resets monthly? | Surface |
|---|---|---:|---|
| **Tracked available balance** | checkpoint + later income − later expenses − later investment transfers | **No** | Home headline and daily guide |
| **Monthly plan remainder** | plan income when set, otherwise recorded income, minus the selected month's expenses (including materialized recurring rows) | Yes | Home supporting meter and Budget hero |
| **Monthly net flow** | recorded income − expenses − investment transfers for the month | Yes | Summary/analysis logic |
| **Net worth** | assets − liabilities | No | Patrimonio / Wealth |

Planned income is not bank cash. A budget limit is not a reserved bank balance.
An owned investment is not necessarily spendable cash. Keeping these figures
separate prevents double-counting and false availability.

---

## 3. Canonical balance formula

```text
trackedBalance = convert(checkpoint.balance)
               + sum(convert(postCheckpointIncomes))
               - sum(convert(postCheckpointExpenses))
               - sum(convert(postCheckpointInvestmentTransfers))
```

`investment_savings_transfers.amount` is signed. A positive deposit into
savings is subtracted from available checking cash; a negative withdrawal is
subtracted as a negative number and therefore increases available cash.

The headline resolver is:

```text
Home amount = finite trackedBalance
            ?? finite monthlyPlanRemainder
            ?? unavailable
```

The monthly remainder is a fallback, not another component of tracked cash. It
must never be added to the tracked balance.

### Daily guide

```text
dailyGuide = max(Home amount, 0) / max(daysInMonth - currentDay, 1)
```

Today is excluded from the divisor and at least one day is always used. A
negative tracked balance remains visible as the headline, but Home recommends
`0` per day instead of suggesting more spending. The UI displays the daily
guide rounded to a whole currency unit.

For any non-current selected month, the existing Home integration passes the
month's final day into the pace helper. The divisor therefore floors to one day.
That is useful for completing historical plan pace but means the daily guide on
past/future views is not a forecast; suppressing or redefining that non-current
guide is a separate presentation hardening opportunity.

---

## 4. Date and checkpoint semantics

The month snapshot receives the browser's local calendar date as `p_as_of`.
The balance target is the earlier of that date and the selected month's end.

| Selected period | Target/status | Result |
|---|---|---|
| Current month | Local today | Latest checkpoint on/before today plus later movements through today |
| Past month | Last day of that month | Historical closing balance for that month |
| Future month | `future`; no checkpoint projection | Home may show the month-plan fallback, never a projected tracked bank balance |

The selected month limits the **target date**, not the checkpoint search to that
month. For example, an August view may correctly use a July checkpoint and all
qualifying movements from that checkpoint through the August target date.

Month-plan totals and tracked cash have different date windows by design. The
plan layer reads the selected month's materialized rows, which can include an
upcoming recurring charge; tracked cash stops at the balance target date and
does not subtract that future-dated charge yet.

### Which movements are after a checkpoint?

A movement is included when:

```text
movement.date > checkpoint.as_of_date
or
movement.date = checkpoint.as_of_date
and movement.created_at > checkpoint.created_at
```

It must also be dated on or before the target date. `created_at` is the tiebreak
only for movements on the checkpoint's calendar date and must remain
server-generated.

Consequences:

- A movement already represented by the real checkpoint balance is not counted
  again.
- A movement entered later on the same day is counted.
- A backfilled movement dated before the checkpoint is excluded because the
  checkpoint supersedes the earlier ledger history.
- Of multiple checkpoints on the same date, the newest `created_at` wins.

---

## 5. Currency and numerical safety

The database keeps every amount in its original currency. The primary RPC sums
Postgres `NUMERIC` values per currency, preserving exact decimal arithmetic. The
legacy JavaScript adapter aggregates rows as integer cents per currency. Both
paths avoid binary-float accumulation before conversion and keep intermediate
totals auditable.

`useMonthlySummary` confirms that the checkpoint currency and every movement
currency can convert into the active base currency. If any required rate is
missing, the tracked value becomes `unavailable`; Home uses the monthly-plan
fallback when that fallback exists. The app must not silently mix unconverted
currencies into a tracked total.

`resolveHomeAvailableBalance` accepts only finite numbers and rounds the chosen
headline source to cents. `NaN` and infinite values are treated as unavailable.

---

## 6. Status and fallback matrix

| Balance state | Home source | User-visible behavior |
|---|---|---|
| `tracked`, all FX available | `tracked` | Carried balance caption; headline and daily guide use real tracked cash |
| `tracked`, required FX missing | monthly fallback when available | Month-only caption; no invalid mixed-currency tracked number |
| `untracked` (no checkpoint by target date) | monthly fallback when available | Income-minus-expenses view until the first reconciliation |
| `future` | monthly fallback when available | Plan view only; no future bank-balance projection |
| Balance read unavailable | monthly fallback when available | Reduced but usable Home experience |
| Neither tracked nor monthly source exists | `unavailable` | Em dash and no daily guide |
| Negative tracked balance | `tracked` | Negative headline remains visible; daily guide clamps to zero |

The fallback requires a positive plan income or positive recorded income. Zero
or missing income makes the monthly cashflow source unavailable.

---

## 7. End-to-end data flow

| Step | Owner | Responsibility |
|---:|---|---|
| 1 | `HomeScreen` | Reads selected month/year and browser-local today |
| 2 | `useMonthlySummary` | Requests and derives one month snapshot in the active base currency |
| 3 | `useMonthSnapshot` / `getMonthSnapshot` | Uses `prepare_month_snapshot(year, month, as_of)` as the primary read path |
| 4 | `prepare_month_snapshot` | Selects target/checkpoint and returns post-checkpoint totals grouped by currency |
| 5 | `calculateTrackedBalance` | Applies checkpoint + income − expenses − transfers |
| 6 | `resolveMonthCashflow` | Derives the separate month-only plan remainder and pace |
| 7 | `resolveHomeAvailableBalance` | Prefers tracked cash, applies fallback and negative daily safety |
| 8 | `HomeSummaryCard` | Renders the carried headline and plan-only support meter |

If `prepare_month_snapshot` is missing, or
`NEXT_PUBLIC_USE_LEGACY_DATA_API=true`, `getMonthSnapshot` adapts the legacy
`GET /api/dashboard/summary` payload into the same `MonthSnapshot` contract.
The UI selection rules do not change between the two read paths.

Primary data-path files:

- [`src/lib/data/client.ts`](../src/lib/data/client.ts)
- [`src/hooks/use-month-snapshot.ts`](../src/hooks/use-month-snapshot.ts)
- [`src/hooks/use-monthly-summary.ts`](../src/hooks/use-monthly-summary.ts)
- [`src/lib/balance-checkpoint.ts`](../src/lib/balance-checkpoint.ts)
- [`src/lib/home/month-cashflow.ts`](../src/lib/home/month-cashflow.ts)
- [`src/components/home/home-screen.tsx`](../src/components/home/home-screen.tsx)
- [`src/components/home/home-summary-card.tsx`](../src/components/home/home-summary-card.tsx)
- [`supabase/migrations/20260723000000_performance_data_contracts.sql`](../supabase/migrations/20260723000000_performance_data_contracts.sql)

---

## 8. Surface ownership

| Surface | What it may show | What it must not imply |
|---|---|---|
| Home headline | Tracked carried cash; month-only fallback if tracking is unavailable | That the amount resets each month |
| Home ring/bar | Selected-month expenses ÷ selected-month income | That plan percentage is a percentage of bank cash |
| Budget hero | Remaining in this month's plan | That it is the reconciled bank balance |
| Settings → Available balance | Reconciliation input, preview, checkpoint history | That a checkpoint is monthly income |
| Movements | Reconciliation surplus/deficit as explicit ledger rows | That the checkpoint balance itself is a transaction |
| Patrimonio / Wealth | Assets, liabilities, and net worth | That net worth is spendable cash |

The two Home layers intentionally appear together: the headline answers “what
cash is available?”, while the supporting meter answers “how is this month's
plan going?”

---

## 9. Reconciliation behavior

Settings → **Available balance** writes an append-only checkpoint. A non-zero
difference between the calculated balance and the real entered balance is also
booked as a dated surplus income or deficit expense so the adjustment remains
visible in Movements.

The adjustment movement is inserted before the checkpoint. The checkpoint then
contains that adjustment in its baseline, and the same-day `created_at`
tiebreak prevents double-counting. If checkpoint creation fails, the API makes
a best-effort rollback of the adjustment movement.

A reconciliation does not “close” a month. It creates a newer trusted anchor;
all later month views use it when it is the latest eligible checkpoint.

---

## 10. Cache and refresh behavior

The month snapshot key is:

```text
["month-snapshot", year, month, asOfDate]
```

Current app behavior:

- Creating or changing a movement invalidates the snapshot for the movement's
  dated month.
- Creating or changing an investment/savings transfer invalidates its dated
  month.
- Import commit and balance reconciliation invalidate all month snapshots.
- There is no realtime subscription; database changes made outside the app
  require a refetch or reload.

**Known coherence edge:** a historical post-checkpoint movement can affect every
later tracked balance, but ordinary movement and transfer hooks currently
invalidate only the movement's dated month. A later month that is still warm in
the React Query cache can remain stale until refetch, reload, or cache expiry.
Future hardening should invalidate `queryKeys.monthSnapshotAll` after any
historical balance-affecting edit, including both old and new months when a
movement date changes.

---

## 11. Regression example

The production issue was reproduced with this read-only reconciliation:

```text
July 31 tracked close                         €368.59
August 1–11 income                            €647.53
August 1–11 expenses                         −€508.31
August 1–11 net flow                          €139.22
Expected August 11 tracked available          €507.81
```

The previous Home headline showed only `€139.22`, which was August's monthly
remainder. The corrected headline shows `€507.81`, because
`€368.59 + €139.22 = €507.81`.

These values are a regression fixture in
[`src/lib/home/month-cashflow.test.ts`](../src/lib/home/month-cashflow.test.ts).
They are not hardcoded into production logic.

---

## 12. Edge cases and non-goals

- **No checkpoint:** keep the month-only fallback; do not invent an opening
  cash balance.
- **Missing FX:** do not mix currencies; fall back safely.
- **Negative balance:** show it; recommend zero per day.
- **Future month:** never extrapolate tracked bank cash.
- **Non-current daily guide:** current code uses a one-day floor; do not treat it
  as a future forecast.
- **Upcoming recurring row:** may affect the month-plan meter before its date,
  but does not affect tracked cash until the target reaches it.
- **Savings withdrawal:** its negative signed transfer increases available
  cash under the existing subtraction formula.
- **Backdated pre-checkpoint row:** excluded because the real checkpoint is the
  newer authority.
- **Reconciliation delta:** visible as a movement but counted only once.
- **No envelope rollover:** this contract carries cash, not unused category
  budget limits.
- **No planned-income cash:** a plan does not increase tracked balance until an
  actual income movement exists.
- **No net-worth merge:** assets and debts remain in Patrimonio.
- **No monthly transfer job:** no cron, trigger, or rollover table is required.

---

## 13. Verification

Automated checks:

```bash
npm run test:home
npm run test:balance
npx tsc --noEmit
npm run build
```

`test:home` protects four contracts:

1. Tracked cash wins over the monthly remainder and carries July into August.
2. Missing tracking falls back to month cashflow.
3. Negative tracked cash produces a zero daily recommendation.
4. Missing both sources remains unavailable.

`test:balance` protects checkpoint ordering, currency aggregation, integer-cent
math, and tracked-balance arithmetic.

Manual acceptance scenarios:

| Scenario | Expected |
|---|---|
| Open current month after a prior-month checkpoint | Headline includes the prior close plus all later movements |
| Switch to a past month | Headline closes at that month's final date |
| Switch to a future month | No tracked projection; plan fallback only |
| Remove/disable required FX | No mixed-currency tracked total |
| Track a negative amount | Negative headline, zero daily guide |
| Compare Home and Budget | Home headline may differ; Budget remains month-only |

---

## 14. Troubleshooting checklist

1. Confirm the selected month and the browser-local `asOfDate`.
2. Check `summary.balanceTrackingStatus`: `tracked`, `untracked`, `future`, or
   `unavailable`.
3. Confirm the latest checkpoint has `as_of_date <= targetDate`.
4. Confirm affected movements are after the checkpoint under the date plus
   `created_at` rule and on/before the target.
5. Include signed investment/savings transfers in the reconciliation.
6. Confirm every checkpoint/movement currency has a rate to the base currency.
7. Refetch or reload after external writes or historical edits.
8. If the ledger projection differs from the real bank, create a new
   reconciliation in Settings instead of editing old checkpoints.
