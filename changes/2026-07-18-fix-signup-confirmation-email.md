# Fix signup confirmation emails for new users

## Summary

Confirmation emails were not reliably sent/deliverable because Supabase Auth
`site_url` was still `http://localhost:3000` with an empty redirect allow list.
Updated Auth URL config to production, fixed signup to wait for confirmation
(instead of jumping straight to onboarding), and pointed confirmation links at
`/auth/callback?next=/onboarding`.

## Product Changes

- Signup with confirm-email enabled shows **Check your email** + **Resend**.
- Duplicate-email signups surface a clear error (Supabase returns empty
  `identities` and does not send mail).
- Confirmation link lands on onboarding after session exchange.
- Auth callback validates `next` is a same-origin path.

## Data Model / Ops

- Supabase Auth (`awpygbfocmynxpadpsji`):
  - `site_url` → `https://budget-expense-seven.vercel.app`
  - `uri_allow_list` → production + localhost callback URLs
- Added `NEXT_PUBLIC_SITE_URL` documentation (set in `.env.local` / Vercel).

## Validation

- Management API PATCH auth config returned 200 with updated `site_url` / allow list.
- `npx tsc --noEmit` on touched auth files.
- Manual: sign up a fresh email → confirmation UI → receive mail → confirm → onboarding.
