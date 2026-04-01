# 2026-04-01 — Fix signup "Failed to fetch"

## Problem
Creating a new user from `/signup` showed "Failed to fetch".

## Root Cause
Supabase env resolution used dynamic access (`process.env[name]`) in shared code.
In the browser bundle this can resolve to missing values, causing the client to fall back to the placeholder Supabase URL and fail network requests.

## Fix
- Refactored `src/lib/supabase/env.ts` to use direct references for client-safe env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Kept server-only fallback support for:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_PUBLISHABLE_KEY`
- Added small normalization helpers and explicit browser/server resolution flow.

## Verification
- `npx eslint src/lib/supabase/env.ts` passes.
- `npm run build` passes.
