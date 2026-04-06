# 2026-04-05 — Cut over budget-expense production to ledger bridge

## Summary
- Verified that the Santander import was present in Supabase project `bahkswifojxcnesfcqbs` and not in the app’s original public project `awpygbfocmynxpadpsji`.
- Confirmed the production domain the user actually uses is `budget-expense-seven.vercel.app`, which belongs to Vercel project `budget-expense`.
- Added the missing server-side environment variables to the real `budget-expense` Vercel project so the bridged expense and income code could query the ledger project in production.
- Redeployed `budget-expense-seven.vercel.app` after the env update and verified the alias now points at deployment `dpl_AEuBm9TyVSDDnL5vKUKjceWnLavB`.

## Product Changes
- No new UI was introduced in this step.
- The production app behind `budget-expense-seven.vercel.app` now has the server-side configuration required to read the imported Santander ledger through the bridge logic already added in code.
- The `/api/expenses` production route now responds at the app layer with authenticated behavior instead of failing due to missing bridge configuration.

## Data Model
- No schema changes.
- No new tables, columns, policies, or migrations.
- Operational configuration changes applied to the Vercel project `budget-expense`:
  - Added `NEXT_PUBLIC_EXCHANGE_API_URL`
  - Added `SUPABASE_URL`
  - Added `SUPABASE_SERVICE_ROLE_KEY`
- These were added for `development`, `preview`, and `production` environments.

## Validation
- Confirmed local bridged query returned `marchCount = 585` for March 2026 expenses for user `36534d1b-8f48-4b5c-8693-aae1673a222c`.
- Confirmed sample March 2026 rows included `Cafeteria Tea`, `Mercadona Av.ra`, `Decathlon Espan`, and Social Security tax entries.
- Confirmed `budget-expense-seven.vercel.app` belongs to Vercel project `budget-expense`.
- Confirmed production alias moved to deployment `dpl_AEuBm9TyVSDDnL5vKUKjceWnLavB`.
- Confirmed unauthenticated production API requests to `/api/expenses?month=3&year=2026` now return app-level `401 {"error":"Unauthorized"}`, proving the route is live and the app is handling auth instead of failing before runtime.
