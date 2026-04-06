# 2026-04-05 — Add Vercel and Supabase handoff doc

## Summary
- Added an operational handoff document for another engineer to reconnect the repository to the correct Vercel project and both Supabase projects.
- Documented where to retrieve project IDs, URLs, environment variables, and the bridge code entry points.

## Product Changes
- No user-facing product behavior changed.
- This is documentation-only work for infrastructure and engineering handoff.

## Data Model
- No schema changes.
- No configuration values were changed in this step.
- The document references the existing Vercel and Supabase setup already in use.

## Validation
- Verified current Git remote.
- Verified local Vercel project link metadata in `.vercel/project.json`.
- Verified current public Supabase URL in local env.
- Verified bridge code entry points under `src/lib/supabase/service-role.ts` and the expense/income server routes.
