# Data Contract and Cache Recovery

## Summary

Added the typed `src/lib/data` boundary, additive bootstrap/month/household and
bulk-budget RPC migration, shared TanStack Query keys, direct RLS ledger CRUD,
AbortSignal propagation, client-side monthly search, and precise month cache
invalidation. Expense capture now receives affected envelope status from the
same insert transaction instead of issuing three follow-up reads.

## Product Changes

Home now consumes shared bootstrap and month snapshot caches. Attention Feed no
longer duplicates profile, review, plan, budget, expense, recurring, and
household reads. Adjacent months load only after explicit navigation intent.

## Data Model

Adds only `SECURITY INVOKER` functions. Recurring entries use the existing
unique key and `ON CONFLICT DO NOTHING`. Applying the migration performs no
financial-row mutation. Authenticated budget replacement RPCs can replace only
the calling user's selected-month budget rows when explicitly invoked. The
transactional expense RPC
uses `auth.uid()`, accepts owned or shared default categories, and returns the
inserted row plus compact alert context.

## Validation

Added rollback-only SQL parity/RLS validation in
`supabase/tests/performance-data-contracts.sql`. A read-only live probe passed
identity and aggregate parity for four users and six representative months.
TypeScript and ESLint pass. The separate Supabase release is recorded in
`2026-07-23-supabase-performance-contract-release.md`.
