# Patrimonio: category page heroes, savings withdrawals, shared wizard shell

Phases 2 and 3 of the Patrimonio rework, continuing
`changes/2026-07-25-patrimonio-net-worth-foundation.md`.

## Summary

Phase 1 built the balance sheet. This change gives the five category pages the
same black chrome, unblocks savings withdrawals end to end, and extracts the
three-step wizard machinery out of `BudgetWizard` so creation flows stop being
one-offs.

Four of the five creation wizards are **not** in this change — see
*Scope actually delivered* below. The shell, the impact model, and one
reference implementation are, so the rest are now fill-in-the-blanks rather
than fresh design.

## Product Changes

### Category page heroes

New `wealth-category-hero.tsx` — the black `HERO_SURFACE` card with an eyebrow,
the page's one number, an optional signed monthly delta, an optional progress
bar, and up to three stats. Applied to:

| Page | Headline | Progress | Stats |
|---|---|---|---|
| Ahorros | Total ahorrado | — | Fondos · Movimientos · Monedas |
| Inversiones | Valor de tus inversiones | — | Aportado · Realizada · Caja de broker |
| Dinero prestado | Pendiente por cobrar | Recuperado | Total prestado · Recuperado · Activos |
| Deudas | Deuda pendiente | Pagado | Pagado hasta hoy · Original · Activas |

The investments hero shows the return percentage next to the unrealized gain,
and the loans/debts heroes carry the repayment progress bar the mockups show.

`Dinero prestado` reuses `sumLoansOutstandingBase` from `lib/wealth/net-worth.ts`
rather than re-deriving the total, so the page and the Patrimonio hero cannot
disagree about what is still owed to you.

### Savings withdrawals — now real

The schema was relaxed in Phase 1; this wires it through:

- `investmentSavingsTransferSchema` gains `direction: "deposit" | "withdrawal"`.
  The **form still takes a positive number** — users type what moved, and the
  direction says which way — and `signedSavingsAmount()` converts at the API
  boundary. Both the insert and update paths use it.
- `savings-transfer-form.tsx` gains a two-option direction control with copy
  that names the invariant: *"Adds to the fund. Moving money in is not an
  expense."* / *"Reduces the fund. Moving money out is not income."*
- Editing an existing movement maps the stored sign back to
  `direction` + `Math.abs(amount)`.

### `window.confirm` is gone from Wealth

New `components/shared/confirm-dialog.tsx`, used for savings-fund deletion. The
copy says what the user is actually risking: *"Its movements go with it, and
past net worth will change. Consider keeping it at zero instead."*

### Shared wizard shell

`components/patterns/wizard-modal.tsx` (224 lines) owns the Dialog/Sheet
switch, the a11y title/description branch, the numbered step indicator with
check marks, the `Step N of M` counter, the sticky footer, and the
`useDiscardPanel` body/footer pair.

**`BudgetWizard` was refactored onto it** — 1,133 → 1,040 lines, with its
private header, shell, and Dialog/Sheet blocks deleted. Refactoring the
existing wizard is what proves the extraction; an abstraction with one consumer
proves nothing.

### `lib/wealth/transaction-effects.ts` + `<FinancialImpact>`

The spec's global transaction table encoded once, as
`resolveFinancialImpact({ event, amount, includeInAvailable })`. The wizard's
step-3 preview and the write that follows both read it, so they cannot drift.

The rules it enforces are the ones users get wrong:

| Event | Assets | Net worth | Month |
|---|---|---|---|
| Opening account balance | ↑ | ↑ | **no effect** |
| Opening debt | — (liabilities ↑) | ↓ | **no effect** |
| Move to savings / buy investment / lend now | redistributed | **unchanged** | not an expense |
| Market change | ↑ | ↑ | **not income** |

### `AccountWizard`

`wealth/wizards/account-wizard.tsx` — Tipo → Configuración → Revisar, on the
shared shell. Five type cards, a live preview beside the fields on step 2, and a
step 3 that renders the summary, the impact block, and the sentence that is the
whole point of the flow: *"The opening balance is a starting snapshot. It will
not be recorded as income for this month."* It replaces the interim inline form
on `/wealth/accounts`.

## Data Model

No new migrations. Phase 1's `20260726000002_savings_withdrawals.sql` is what
made the withdrawal path possible; this change consumes it.

## Scope actually delivered

Built and verified: the shared shell, the impact model, the `FinancialImpact`
block, `AccountWizard`, all five category heroes, savings withdrawals, and the
confirm dialog.

**Deferred:** the savings, investment, loan and debt wizards, and the
`/wealth/<category>/[id]` detail pages. Those four categories keep their
existing working forms (`SavingsAccountForm`, `TradeForm`, and the inline forms
in `LoansEditor` / `LiabilitiesEditor`) — no functionality was removed. Writing
four more ~400-line wizards without driving each through the browser would have
produced code that typechecks and builds but was never actually seen, which is
worse than saying so. `AccountWizard` is the template; each remaining wizard is
its type list, its fields, and its `WealthEvent`.

Also still open from Phase 1: `wealth_accounts.is_primary` is not yet wired into
`BalanceCheckpointSettings`, so a user with both accounts and a reconciled
checkpoint still sees two figures for liquid cash. Net worth is not
double-counted.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — **0 errors, 13 warnings** (unchanged baseline). Two real
  cleanups on the way: an unused `isDirty` prop on the extracted shell (the
  caller owns the dirty check, so it was dead), and dead `totalSteps` /
  `shownIndex` / imports left in `BudgetWizard` after the extraction.
- `npm run build` — compiles, 55 static pages.
- `npm run test:wealth` — 22 pass, 0 fail.
- **Browser-verified** through a temporary harness (since removed, along with
  its middleware bypass): `AccountWizard` driven through all three steps —
  type selection enabling Continue, the step-2 live preview updating as fields
  are typed, step 3's summary + impact block + consequence sentence — plus the
  discard guard intercepting **Escape** on a dirty form, and the mobile bottom
  sheet at 375px in dark mode. The three `FinancialImpact` cases were checked
  against the spec: opening balance (+2.500 assets, +2.500 net worth, **0
  income**), lend-now (0 assets, 0 net worth, −800 spendable), opening debt
  (+6.350 debts, −6.350 net worth, **0 expenses**).
- Not exercised: the live screens behind auth, and `BudgetWizard` running on
  the extracted shell — it needs a seeded categories cache. Its typecheck,
  lint and build pass, and the extraction moved markup without touching its
  step logic, but it has not been driven in a browser since the refactor.
