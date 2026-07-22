# Supabase Performance Contract Release

## Summary

Applied the additive performance-contract migration to the Supabase project
linked to the application. The migration filename now uses Supabase CLI's
timestamp convention so migration history can record it reliably.

## Product Changes

The deployed database now exposes the typed bootstrap, monthly snapshot,
household insight, transactional budget copy/replace, and expense-envelope RPC
contracts used by the recovered Next.js client. Compatibility adapters remain
available for rollback during the first stable release.

## Data Model

Added only `SECURITY INVOKER` functions and authenticated execute grants. The
migration application did not invoke the functions' transactional write paths
and did not create, update, or delete financial rows.

## Validation

`supabase db push --dry-run` selected only
`20260723000000_performance_data_contracts.sql`. The linked project matched the
app's configured Supabase project, the applied local and remote migration IDs
match, and `supabase db lint --linked --schema public` reported no errors.
Read-only counts for all 25 tables used by the app were identical before and
after deployment, including 2,544 expenses and 430 income entries.
