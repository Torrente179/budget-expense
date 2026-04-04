# 2026-04-05 — Fix expense and income server read path

## Summary
- Moved expense and income page data reads behind authenticated Next.js route handlers so the app no longer depends on browser-side Supabase session state to render imported ledger rows.
- Routed expense and income create, update, and delete actions through the same server-backed API surface for consistency with the cookie-authenticated session.

## Product Changes
- `/expenses` now loads monthly expense rows from a server route that resolves the logged-in user from cookies before querying Supabase.
- `/incomes` now loads monthly income rows through the same server-side auth path.
- Expense and income mutations now use the internal API routes, which keeps the ledger working even when the browser Supabase client is not carrying the session correctly.

## Data Model
- No schema or migration changes.

## Validation
- `npm run build`
