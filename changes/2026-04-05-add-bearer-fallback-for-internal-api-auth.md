# 2026-04-05 — Add bearer fallback for internal API auth

## Summary
- Added a bearer-token fallback for internal expense and income API routes so authenticated reads and writes still work when the browser has a valid Supabase session but the server-side cookie session is missing or stale.

## Product Changes
- `/expenses` and `/incomes` now send the current browser access token to the internal API when available.
- Internal expense and income routes now accept either the cookie-backed session or the browser bearer token before querying Supabase.

## Data Model
- No schema or migration changes.

## Validation
- `npm run build`
