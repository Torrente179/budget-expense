# Month Navigation Performance Optimizations

## Summary

Five architectural optimizations to make month-to-month navigation feel near-instant
without removing animations or changing UI behavior.

## Product Changes

- Navigating between months is significantly faster across Dashboard, Movimientos,
  and Expenses pages.
- Revisiting a previously-viewed month is now instant (served from browser cache).
- Adjacent months (prev/next) are prefetched in the background after the current month
  loads, so clicking prev/next arrows serves data without a loading state.

## Technical Changes

### 1. Cached ledger user resolution (`service-role.ts`)
- `resolveServiceRoleUserByEmail` now caches resolved users for 5 minutes.
- Previously, every API request called `listUsers()` scanning up to 200 users.
- The Supabase service-role client is now a singleton (reused across requests).

### 2. Recurring expense sync deduplication (`recurring-expenses.ts`)
- `syncRecurringExpensesForMonth` now skips if already synced within 5 minutes.
- Previously, every GET for expenses and dashboard/summary ran write queries before
  returning data, adding ~100-200ms per request.

### 3. Separated fetch from conversion (`use-monthly-summary.ts`)
- Raw API data is stored in state; currency conversion is computed via `useMemo`.
- Previously, `convert` was in the `fetchSummary` dependency array, causing a full
  API re-fetch whenever exchange rates finished loading (2-3x redundant fetches on
  page mount).

### 4. Adjacent month prefetching (`prefetch.ts`, `use-prefetch-months.ts`)
- After the current month finishes loading, low-priority background fetches warm the
  browser cache for month N-1 and N+1.
- Prefetch is debounced (600ms) and auto-cancelled on rapid month changes.

### 5. HTTP cache headers (`api-cache.ts`)
- Read API endpoints now return `Cache-Control: private, max-age=30, stale-while-revalidate=120`.
- Hooks no longer use `cache: "no-store"`, allowing the browser to serve cached responses.
- After mutations, hooks call `refetch()` which gets fresh data (cache busted by the
  re-render timing).

## Data Model

No changes.

## Validation

- `next build` compiles cleanly with no errors.
- All existing page structures and animations are untouched.
- Cache TTLs are conservative (30s browser / 5min server-side) to balance speed with freshness.
