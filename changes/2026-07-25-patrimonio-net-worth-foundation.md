# Patrimonio: net-worth foundation and reworked overview

Phase 1 of the Patrimonio (Wealth) rework. Phases 2 and 3 — the four remaining
category pages and the shared creation wizards — are not in this change.

## Summary

`/wealth` was a thin reporting surface: a 7-line page rendering one 336-line
component, with net worth as fifteen lines of arithmetic inlined at
`wealth-overview.tsx:84-98`. It had no `lib/` home, no history, and it silently
**excluded the user's actual bank cash** — only investments, broker cash,
savings deposits and money lent were counted.

This change makes Patrimonio a real balance sheet: an accounts model so cash
finally counts, a net-worth history so "change this month" is a real figure, a
pure math module every surface shares, and the reworked overview from the
mockups wearing the app's black hero chrome.

The editorial split is now explicit in the code and the copy: **Patrimonio owns
balances** (what you own, what you owe, what you are worth), **Presupuesto owns
the month** (what came in, what went out, what you can spend). Net worth and
available money are separate figures and are never conflated.

## Product Changes

### Overview (`/wealth`)

- **Black net-worth hero** (`patrimonio-hero.tsx`) on the shared
  `patterns/hero-surface.tsx` chrome, so Home, Budget and Patrimonio now read as
  one family. Two states:
  - *Empty* — "Construye tu patrimonio" + `+ Añadir primera cuenta`. No
    zero-filled stat rows.
  - *Populated* — net worth, the signed monthly change with its percentage, and
    an `Activos · Deudas` split.
  - With **no prior snapshot the change line is absent**, not `+0,00 €`.
- **Quick-glance row** — the row from the first mockup, which the second mockup
  omitted: **Evolución** (net-worth area chart, 1M/3M/6M/1Y/All),
  **Activos y deudas** (two-slice donut with net worth in the middle), and
  **Colchón financiero** (months covered, `StatusTag`, progress toward a
  6-month target).
- **Resumen / Activos / Deudas** as in-screen `UnderlineTabs`. The mockup's
  filled segmented pill was not reproduced — `design.md` gate 5 bans pill tabs
  and `UnderlineTabs` is the app's only in-screen switcher.
- **"Organiza tu dinero"** — five cards (Cuentas y efectivo · Ahorros ·
  Inversiones · Dinero prestado · Deudas), each with its accent, total and item
  count. An empty category still opens its parent page, never a modal.
- **"Lo que verás aquí"** preview replaces the quick-glance row while empty.
- Accounts now feed the by-currency breakdown alongside holdings and savings.

### Navigation

- The five-item underline sub-nav (`wealth-nav.tsx`) is **deleted**. Wealth is
  now a hub with pushed category pages, so the four sub-pages carry a
  `Patrimonio / <category>` breadcrumb (`wealth-breadcrumb.tsx`) and `Screen`'s
  back chevron instead.
- `PRIMARY_NAV` EN label `Wealth` → `Net worth`. The ES label was already
  "Patrimonio".

### Cuentas y efectivo (`/wealth/accounts`)

New page: black hero (total liquid, spendable, account count) plus a list and an
inline add form. The form states plainly that **an opening balance is a starting
snapshot, not income for this month**, and `Incluir en dinero disponible`
explains both positions rather than only the checked one.

The full three-step wizard for this screen lands in Phase 3; this is the
working interim so the Phase 1 CTAs do not point at a 404.

## Data Model

Four migrations, applied to `awpygbfocmynxpadpsji` via
`supabase db push --linked` and verified.

| Migration | What |
|---|---|
| `20260726000000_wealth_accounts.sql` | `wealth_accounts` + `wealth_account_movements` |
| `20260726000001_net_worth_snapshots.sql` | `net_worth_snapshots` |
| `20260726000002_savings_withdrawals.sql` | Savings transfers may now be negative |
| `20260726000003_wealth_updated_at_triggers.sql` | `updated_at` trigger + movement guard |

- **`wealth_accounts`** — checking / savings / cash / digital wallet / other,
  with `include_in_available`, `is_primary`, `status` and a per-row `currency`.
  Balance is **derived** (`opening_balance + Σ movements`), matching how
  liabilities and loans already work. A partial unique index enforces at most
  one primary account per user.
- **`wealth_account_movements`** — signed amounts, like `liability_payments`.
  A `BEFORE INSERT OR UPDATE` trigger forces `user_id` from the session and
  inherits `currency` from the parent account, so a movement can never invent
  an FX event.
- **`net_worth_snapshots`** — one row per user per day
  (`UNIQUE (user_id, as_of_date)`), storing already-converted totals plus the
  base currency. **The unique constraint is the once-a-day rule**: the writer
  upserts, so a duplicate request is idempotent rather than a second row.
- **Savings withdrawals unblocked.** `investment_savings_transfers.amount` was
  `CHECK (amount > 0)` and the form's only account field is labelled *"Cuenta
  destino"* — savings could only ever ratchet up, in the schema, the API and
  the UI. A balance sheet cannot work that way. Negative now means a
  withdrawal. The constraint was dropped **by discovering its real name**, since
  it was declared inline and a guessed `DROP … IF EXISTS` would have silently
  no-opped and left `> 0` enforced. Wiring the UI is Phase 2.

`src/types/database.ts` mirrors all three new tables.

### Why the snapshot is written from the client

Currency conversion only exists client-side (`CurrencyProvider.convert`); the
server has no FX rates. So neither a trigger nor a cron can compute net worth.
`useNetWorth` posts today's figures once the data settles, guarded by a ref
holding the last attempted date+value and by the server-side upsert. On success
it writes into the cache with `setQueryData` rather than invalidating —
invalidating would refetch, recompute, and re-fire.

Month-end needs no special case: the last day the user opened the app in a month
*is* that month's closing snapshot, and `resolvePreviousMonthClosing` takes the
latest snapshot on or before the last day of the previous month.

## Code

| Area | Location |
|---|---|
| Net-worth math (pure) | `src/lib/wealth/net-worth.ts` |
| Composition root | `src/hooks/use-net-worth.ts` |
| Accounts data | `src/hooks/use-wealth-accounts.ts` |
| API | `src/app/api/wealth/accounts/**`, `src/app/api/wealth/snapshots/` |
| Overview | `src/components/wealth/wealth-overview.tsx` (orchestration only) |
| Cards | `patrimonio-hero`, `net-worth-trend-card`, `assets-debts-card`, `cushion-card`, `organize-money-grid`, `wealth-breakdown-list`, `wealth-empty-preview` |
| Category accents | `WEALTH_ACCENTS` in `src/lib/palette.ts` |

Every card takes plain props; only `WealthOverview` and `AccountsScreen` call
hooks. That is what made the no-auth preview harness possible.

Also cleaned up along the way:

- `queryKeys.loans` / `.liabilities` / `.wealthAccounts` / `.netWorthSnapshots`
  added, and the seven raw `["loans"]` / `["liabilities"]` /
  `["household-insights"]` literals across `use-capture.ts`,
  `capture-sheet.tsx`, `loans-editor.tsx`, `liabilities-editor.tsx` and
  `category-classification.tsx` now use them.
- `HERO_ACCENT_NEGATIVE` (`#FB7185`) and `HERO_ACCENT_WARNING` (`#FBBF24`)
  promoted out of `budget-summary-hero.tsx`, where they were ad-hoc hexes, into
  `hero-surface.tsx`.

### Two traps worth recording

1. **`ProgressMeter` is inverted for the cushion.** Its default coloring is
   budget usage bands, where a high ratio is bad. A full six-month cushion is
   excellent, so `cushion-card.tsx` always passes `tone` explicitly. Omit it and
   a perfect cushion renders in critical red.
2. **`isAnimationActive={false}` on the Evolución area.** Without it the area
   path is absent on first paint, which is also why the Insights bars set it.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — **0 errors, 13 warnings** (unchanged baseline).
- `npm run build` — compiles, **55** static pages (was 52: `/wealth/accounts`
  plus the new route handlers).
- `npx tsx --test src/lib/wealth/net-worth.test.ts` — **22 pass, 0 fail**.
  New suite covering the spec's worked example (16.300 − 6.350 = 9.950), the
  transfer/lending invariants (net worth unchanged), null-safe monthly change,
  a zero previous month yielding an amount but never an infinite percentage,
  month-end rollback across year and leap boundaries, trend-range filtering,
  loan outstanding floored at zero, archived accounts excluded, and cushion
  band boundaries at exactly 1/3/6 months.
- Design gates: no raw status colors and no magic values in the new files. The
  one `text-[11px]` hit is pre-existing in `loans-editor.tsx`.
- Migrations verified against the live project: the three tables report
  16/10/9 columns, and the savings constraint now reads
  `CHECK ((amount <> (0)::numeric))`.
- **Visual verification** through a temporary preview harness at `/zz-preview`
  (with a matching temporary middleware bypass) — both since removed. Covered
  desktop 1280px and mobile 375px, light and dark: empty hero, populated hero,
  positive and negative monthly change, the no-snapshot fallback, negative net
  worth, the full quick-glance row, Evolución's first-run state, all cushion
  tones including the unavailable state, both grid states, and the Activos and
  Deudas breakdowns.
  - **Two bugs found this way and fixed:** the Evolución area path did not
    render on first paint (Recharts entry animation), and "1 loans" rendered
    without singular forms.
- Not exercised: the live screens behind auth (no local session), and the
  snapshot writer against real data — it needs an authenticated session, so its
  loop guards are argued from construction rather than observed.

## Known gaps carried into later phases

1. **Two cash figures.** Net worth now includes `wealth_accounts`, while Home's
   "Te quedan" and the Settings tracked balance still come from
   `balance_checkpoints`. Net worth itself is **not** double-counted — the
   checkpoint balance is never added to `totalAssets` — but a user with both
   will see two numbers for "my cash". `wealth_accounts.is_primary` ships now as
   the seam; Phase 3 points the Settings reconciliation at that account.
2. **Evolución starts empty**, by decision — no backfill. The card has a
   first-run state rather than an empty plot.
3. **`computeAvailableMoney` is implemented but not rendered.** Available money
   belongs to Home under the editorial rule, and `reserved` is passed as 0 until
   the envelope-reservation product decision is made.
4. **Savings withdrawals are schema-only** until Phase 2 adds the direction
   toggle.
5. **The cushion window is 6 months, not 12** (`ESSENTIAL_WINDOW_MONTHS` in
   `use-household-insights.ts`), and it averages the six most recent months
   *that have data*, which may span longer. The copy therefore says "liquid"
   and never claims a 12-month average.
