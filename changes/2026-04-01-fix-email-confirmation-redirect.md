# 2026-04-01 — Fix email confirmation redirect URL

## Problem
Signup confirmation emails were redirecting to `localhost:3000`, causing confirmation failures when users clicked links outside local development.

## Root Cause
`supabase.auth.signUp()` did not provide `emailRedirectTo`, so Supabase used default project URL settings (which pointed to localhost in this case).

## Fix
- Updated signup flow to send an explicit redirect URL:
  - `<app-origin>/auth/callback`
- Added support for `NEXT_PUBLIC_SITE_URL` as preferred origin.
- Fallback remains `window.location.origin` when the env var is not set.

## Verification
- `npx eslint src/components/auth/signup-form.tsx` passes.
- `npm run build` passes.
