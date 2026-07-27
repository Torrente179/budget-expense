# Patrimonio: close the last gaps and harden for production

Final pass on the Patrimonio rework. Closes the three gaps recorded in
`changes/2026-07-26-patrimonio-wizards-and-item-detail.md` and runs the
production checks.

## Summary

Everything the rework promised is now built and observed working. The three
open items were an inherent double-count with no warning, two missing detail
pages, and one regression I had reasoned about but never actually watched run.

## Product Changes

### The savings/account overlap now warns

A bank savings account can legitimately be entered as a `wealth_accounts` row
of kind `savings` **or** as a savings fund — the spec lists "Cuenta de ahorro"
in both wizards, because a fund with a goal is not the same object as a current
account. Both count toward net worth, so entering it twice doubles it.

New `wizards/overlap-notice.tsx` warns inline and links to the other place,
non-blocking, the same way `BudgetWizard` handles two envelopes sharing a
category. It fires in the account wizard when kind is `savings`, and in the
savings wizard when kind is `account`.

### Loan and debt detail pages

`/wealth/loans/[id]` and `/wealth/liabilities/[id]`, on the shared
`WealthItemDetail`, showing repayments and payments as movements with recovery
or payoff progress.

Both close the item (`is_active: false`) rather than deleting it. The payments
are real ledger history — deleting the parent would orphan them and change what
past months looked like. The debt page also labels a **negative** payment as a
balance increase, since `liability_payments.amount` is signed and a negative
row is an upward adjustment, not a refund.

All four category lists now link their rows to the detail pages.

## Fixed

- **`text-[11px]` in `loans-editor.tsx`** replaced with the `label-caps`
  utility. It was a pre-existing `design.md` gate-2 violation (magic type
  value); `text-label` is exactly 11px, so nothing moved visually. Gate 2 now
  passes clean across `src/components/wealth/` and `src/app/api/wealth/`.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — **0 errors, 13 warnings** (unchanged baseline).
- `npm run build` — compiles, 56 static pages.
- `npm run test:wealth` — 22 pass · `npm run test:balance` — 8 pass.
- `npm run check:parity` — **import parity OK**, 7 expenses / 4 incomes /
  3 tithes / 1 skipped, identical across Python and TS. The load-bearing
  contract is intact.
- Design gates 1, 2 and 4 clean across all new code.

### The regression I had not actually watched

`BudgetWizard` was refactored onto the extracted `WizardModal` two commits ago.
It typechecked and built, but I had never driven it — the extraction moved its
header, shell and Dialog/Sheet blocks, and its step indicator switched from a
hardcoded ternary to deriving an index from a `steps` array, which is exactly
the kind of change that passes a compiler and breaks a screen.

Verified through a harness with a seeded categories cache:

- **Create** — "Step 1 of 3", both branch cards, footer intact.
- **Edit** — "Step 1 of **2**", the type step correctly skipped and the kind
  locked to a read-only chip. This is the case the new index derivation was
  most likely to get wrong.
- The step-2 **honest preview** still reports `63% used` and
  `Includes €250.60 already recorded this month`.
- The **overlap warning** still fires: *Housing already belongs to "Casa"…*
- The **discard guard** still intercepts Escape on a dirty form — meaning the
  `formState.isDirty`-must-be-read-during-render fix survived the move.

No regression. The extraction is sound.

### Security and infrastructure

- All six wealth API routes: 401 without a user, and every read and write
  filtered by an explicit `user_id` — the invariant `Architecture/03` §3.7
  calls the most important one in the codebase, since service-role queries
  bypass RLS.
- RLS confirmed **enabled with 4 policies** on all four new tables
  (`wealth_accounts`, `wealth_account_movements`, `net_worth_snapshots`,
  `wealth_investments`).
- All eight CLI-tracked migrations report local **and** remote; none pending.
- Temporary preview harness and its middleware bypass removed;
  `src/lib/supabase/middleware.ts` verified byte-identical to its committed
  form.

## Remaining known behaviour (documented, not defects)

1. **Two cash figures can still diverge between reconciliations.** The Settings
   reconcile writes an adjustment to the primary account, so they agree at that
   moment; independent edits afterwards can drift until the next reconcile.
2. **Evolución starts sparse** — snapshots are not backfilled, by decision.
3. **Savings movement history is aggregate**, not per-fund; a per-fund view
   needs a filtered `investment_savings_transfers` query.
4. **`computeAvailableMoney` is implemented but not rendered** on Patrimonio.
   Home owns "now" under the editorial rule, and `reserved` stays 0 until the
   envelope-reservation decision is made.
