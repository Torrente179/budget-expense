# 2026-04-01 — Fix client-side crash from missing env vars

## Problem
The app crashed on Vercel with "Missing Supabase environment variables" because `getSupabaseEnv()` threw an error when `NEXT_PUBLIC_*` env vars weren't embedded in the client bundle at build time.

## Fix
- Changed `getSupabaseEnv()` to return `null` instead of throwing
- Updated browser client (`src/lib/supabase/client.ts`) to return a placeholder Supabase client when env vars are missing — app loads gracefully and redirects to login
- Server client still throws (env vars always available server-side)
- Middleware already had its own graceful fallback (unchanged)
