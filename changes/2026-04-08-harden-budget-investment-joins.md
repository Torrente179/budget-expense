## Summary
- Hardened `budgets` and `investments` data-loading paths against intermittent page crashes caused by nullable joined records returned from Supabase.
- Added normalization in client hooks to drop malformed rows with missing join targets instead of letting render-time null dereferences break route loading.

## Product Changes
- `Investments` pages now ignore trade, cash movement, savings transfer, or watchlist rows whose joined records are missing, and log a warning to aid debugging.
- `Budgets` page data now normalizes custom budget category links and ignores links where the category join is missing.
- Copying budgets from a previous month now uses normalized category links, preventing copy-time/runtime failures when historical links are partially invalid.

## Data Model
- No schema or migration changes.

## Validation
- `npm run build` succeeds on Next.js 16.2.2 after the patch.
- `npm run lint` still reports existing pre-patch repository errors in unrelated files (analytics/calendar/dashboard and other known warnings), with no new errors introduced by this change.
