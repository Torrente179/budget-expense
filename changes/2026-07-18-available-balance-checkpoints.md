# Available balance checkpoints

## Summary

- Added append-only available-balance checkpoints so the dashboard can track actual cash from a confirmed bank balance.
- Kept monthly net flow separate from the tracked balance and from reconciliation metadata.
- Added Doralis's confirmed COP 7,025,963.50 checkpoint without storing a bank account number.

## Product Changes

- Home now shows `Disponible` from the latest applicable checkpoint plus later income, minus later expenses and investment transfers.
- Current-month balances stop at the user's local current date, historical months close at month-end, and future months are not projected.
- Settings now includes a bilingual balance-reconciliation form. It accepts localized decimal formats, previews the difference, and explains that reconciliation is not income.
- Grouped amounts are parsed by locale (`7.025.963,50` and `7,025,963.50`) with inline accessible validation.
- Opening reconciliation uses separately paginated month-to-date totals, so it remains exact beyond the API's default 1,000-row limit.
- The weekly review now calls the former `Disponible este mes` calculation `Flujo neto este mes` so it cannot be confused with actual cash.
- Investment savings-transfer mutations now invalidate dashboard summaries because transfers affect tracked available cash.

## Data Model

- Added `balance_checkpoints` as an immutable, user-scoped table with balance, currency, as-of date, comparison basis, reconciliation delta, and server-generated creation time.
- Added row-level security for own-row reads and inserts only. Authenticated inserts cannot choose another user or forge the server timestamp.
- The checkpoint API derives currency from the authenticated user's profile; the displayed client currency is used only as a compare-and-reject guard against concurrent profile changes.
- Reconciliation stays disabled unless the profile currency was loaded successfully and while a currency update is pending; currency changes become visible only after the profile write succeeds.
- No bank name, bank account number, or other bank-account identifier is stored.
- Doralis's opening metadata records July 1 as the comparison-period start, July net flow of COP -2,765,634.38, and an opening reconciliation of COP +9,791,597.88. The adjustment is audit metadata only.

## Validation

- Applied the migration to the live app Supabase project.
- Restored the source-exact July 6 screenshot expense from COP 277,254.00 to COP 777,254.00 before calculating the checkpoint basis.
- Verified live July totals: COP 1,752,489.50 income, COP 4,518,123.88 expenses, COP 0.00 investment transfers, and COP -2,765,634.38 net flow.
- Verified Doralis's live tracked available balance is exactly COP 7,025,963.50 with no later eligible movements.
- Verified the repository and live checkpoint schema contain no bank account number.
- Added table-driven tests for same-day ordering, more than 1,000 rows, null/untracked behavior, localized grouped input, and Doralis's exact figures. Route logic separately caps the current month and excludes future months.
- The core five-case balance suite passed. Final code passes `npx tsc --noEmit` and targeted ESLint with no warnings.
- A production Next.js build completed successfully before the final review fixes. The final rerun reached only the existing Google Fonts network restriction; the final TypeScript and lint checks pass.
