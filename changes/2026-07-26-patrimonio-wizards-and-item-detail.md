# Patrimonio: the four remaining wizards, item detail, and balance unification

Completes the Patrimonio rework begun in
`changes/2026-07-25-patrimonio-net-worth-foundation.md` and
`changes/2026-07-26-patrimonio-category-pages-and-wizard-shell.md`.

## Summary

The previous change shipped the wizard shell and one reference implementation.
This one builds the other four, adds a model the mockups needed but the schema
could not express, gives every item a detail page that archives rather than
deletes, and closes the "two cash figures" gap by pointing the Settings
reconciliation at the primary account.

## Product Changes

### Four wizards, all on the shared shell

| Wizard | Type step | The consequence it exists to state |
|---|---|---|
| **Ahorro** | Fondo de emergencia · Meta de ahorro · Cuenta de ahorro · Otro | This is money already set aside, not a monthly Meta on Presupuesto — counting the same euro in both would double it |
| **Inversión** | Cuenta · Fondo/ETF · Acciones · Cripto · Pensiones · Otra | An unrealized gain raises net worth but is **not income** until you sell |
| **Dinero prestado** | **Ya fue prestado** vs **Voy a prestarlo ahora** | Lending moves money between your own assets: net worth unchanged, and it is not an expense |
| **Deuda** | Tarjeta · Personal · Hipoteca · Vehículo · Persona | An opening balance lowers net worth but is **not spending this month** |

The loan wizard's type step is the one that changes behaviour, not just copy:
"already lent" is an opening snapshot and writes **no** movement, while
"lending now" sets `create_movement` so a Loan expense appears in Movements.
Booking a movement for money that left months ago would invent spending on a
date that has already passed.

Shared `wizard-parts.tsx` holds the `TypeStep` radiogroup and the review table
so the four wizards differ only where they should — their options, fields and
`WealthEvent`.

### Manually valued investments

The mockup's *Añadir inversión* asks for **current value** and **contributed
cost**. The existing model cannot express that: it is trade-based
(`brokerage_accounts → investment_assets → investment_trades`), deriving market
value from FIFO lots and live quotes, and it needs a quantity and a ticker.
"My pension is worth 10.000 € and I put in 9.550 €" has neither.

So there are now two investment models, and they never overlap:

- **Trade-tracked** — unchanged, priced by the quote provider.
- **Manually valued** — new `wealth_investments`, priced by the user.

Net worth sums both. The Inversiones page lists manual holdings in their own
"Valued by you" card, so it stays obvious which numbers come from a feed and
which are a figure somebody typed.

### Savings goals

`investment_savings_accounts` gained `target_amount`, `target_date` and
`include_in_available`. Without a target there was no way to draw the mockup's
"5.200 € de 7.500 €, 69% completado"; without the flag there was no way to say
a fund is reserved. A fund with no target shows **no** progress bar rather than
0%.

The wizard speaks plainly (name, where it is held, balance) and maps once, in
the page, to the table's `country_code` / `product_type` shape — the wizard
never has to know those exist. An opening balance is written as the fund's
first movement so balance and history agree from the start.

### Item detail pages

`/wealth/accounts/[id]` and `/wealth/investments/[id]`, on a shared
`WealthItemDetail`: hero, stats, movement list, and **archive**.

Archive, not delete. These rows feed historical net worth — hard-deleting one
silently rewrites months of the Evolución chart with nothing in the UI to
explain why the line moved. The confirm dialog says exactly that.

The investment detail page owns the action these holdings actually need:
**update the value**, with a live preview of the change, since nothing else
will move it.

### One cash figure, not two

Saving a reconciliation in Settings now also records an `adjustment` movement
on the primary account, so `wealth_accounts` matches the reconciled balance.
Previously the app carried two independent statements of the same money.

The account balance is derived from movements, so writing the difference is the
only honest way to move it — and if that write fails the toast says the
reconciliation *succeeded* but the account did not sync, because it did.

Accounts can be promoted to primary from the list. A partial unique index
allows only one, so promoting demotes the incumbent first.

## Data Model

| Migration | What |
|---|---|
| `20260726000004_wealth_investments.sql` | `wealth_investments` — manually valued holdings |
| `20260726000005_savings_targets.sql` | `investment_savings_accounts.target_amount`, `target_date`, `include_in_available` |

Both applied via `supabase db push --linked` and verified (14 columns on
`wealth_investments`; all three savings columns present). All six Patrimonio
migrations report local **and** remote.

`investmentSavingsTransferSchema` also gained `direction`, with
`signedSavingsAmount()` signing at the API boundary — the form keeps taking a
positive number.

### One API contract widened

`POST /api/investments` now returns `{ ok, id }` for `savingsAccount` creates.
The savings wizard needs the new id to attach the opening movement, and
`runMutation` previously discarded everything. It resolves to an `Error` rather
than throwing, so the page checks `instanceof Error` before chaining —
otherwise a failed create would be followed by an orphan movement.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — **0 errors, 13 warnings** (unchanged baseline).
- `npm run build` — compiles, 56 static pages.
- `npm run test:wealth` — 22 pass, 0 fail.
- **Browser-verified** through a temporary harness (removed, with its
  middleware bypass). Each wizard driven through its steps:
  - **Loan / lending now** → `Assets €0.00 · Net worth €0.00 · Spendable
    −€800.00 · Expenses €0.00` — the spec's transfer row exactly.
  - **Debt / credit card** → `Debts +€1,250.00 · Net worth −€1,250.00 ·
    Spendable €0.00 · Expenses €0.00`.
  - **Investment** → step 2 showing `Unrealized gain +€450.00 · +4.71%` from
    10.000 value against 9.550 cost, with the live preview.
  - **Savings** → target progress rendering `25% complete` with the reserved
    (unchecked) availability copy.
- Not exercised: the live screens behind auth, `BudgetWizard` on the extracted
  shell (needs a seeded categories cache), and the reconciliation → primary
  account sync, which needs a session plus a primary account. Its failure path
  is written to degrade rather than mislead.

## Known gaps

1. **A bank savings account can still be entered twice** — once as a
   `wealth_accounts` row of kind `savings`, once as a savings fund. The spec
   lists "Cuenta de ahorro" in *both* wizards, so this is inherent to the
   product design rather than an oversight. Neither wizard warns yet; the
   pattern to copy is `BudgetWizard`'s non-blocking envelope-overlap notice.
2. **Loan and debt detail pages** are not built. Those categories keep their
   existing inline row expansion for payments; only accounts and manual
   investments have `/[id]` pages.
3. **Movement history on the savings detail** would need a per-fund view of
   `investment_savings_transfers`; the fund list still shows them in aggregate.
