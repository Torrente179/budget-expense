# 2026-08-11 — Carry available balance across months

## Summary

- Home now headlines the checkpoint-backed available cash balance instead of
  resetting the figure to income minus spending at every month boundary.
- The monthly budget engine remains separate: its pace, percentage, and Budget
  hero still describe only the selected month's plan.

## Product Changes

- `HomeSummaryCard` prefers the latest tracked balance, which already equals
  checkpoint + later income − later expenses − later investment transfers.
  That makes one month's closing cash the next month's opening cash.
- If balance tracking is unavailable, Home keeps the safe existing fallback of
  monthly income minus monthly outflows.
- Home copy now identifies the headline as a balance accumulated month to
  month. Its daily guide uses that same carried balance, while the progress bar
  remains explicitly plan-based.
- `BudgetSummaryHero` now calls its separate figure "Remaining in this month's
  plan" / "Restante en el plan de este mes" so it cannot be mistaken for the
  bank-backed cash balance.

## Data Model

- No schema or live-data rewrite. The fix consumes the existing immutable
  `balance_checkpoints` record and existing post-checkpoint movement totals.

## Validation

- Added pure tests for tracked-balance priority, untracked fallback, negative
  balance safety, and the unavailable state.
- Live read-only reconciliation for Juan: July 31 tracked close **€368.59**;
  August 1–11 net flow **+€139.22**; August 11 tracked available
  **€507.81**.
- `npm run test:home` — 4 passed; `npm run test:balance` — 8 passed.
- `npx tsc --noEmit` and targeted ESLint — clean.
- `npm run build` — compiled and generated all 56 static pages.
- Rendered the exact €507.81 scenario at 1280×720 and 390×844 in English
  and Spanish. The tracked-balance label, plan context, and daily guide fit
  without document-level horizontal overflow; the fresh render logged no
  errors.
