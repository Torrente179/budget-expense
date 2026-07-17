# Onboarding, goals, budget alerts, and back navigation

## Summary

Adds a skippable first-run setup wizard that collects income, recurring costs, debt, and goals; personalizes Home/Budget/Attention from those choices; shows in-app envelope limit toasts and Attention items at 75/90/100%; and makes screen back buttons use previous-page navigation with a safe fallback.

## Product Changes

- New `/onboarding` wizard (welcome → income → recurring → debt → goals → suggestions → done), skippable at any time.
- After signup / first login, users without `onboarding_completed_at` or `onboarding_skipped_at` are steered to the wizard (middleware + client gate). Settings and the wizard remain reachable.
- Home shows a “Finish setup” banner when onboarding is incomplete (skipped); Settings exposes a “Setup guide” resume link.
- Goals drive Home quick actions, Attention hints (debt / cut spending), and Budget empty-state copy when the user asked for budgeting help.
- After capturing an expense, in-app toasts warn when an affected custom budget crosses 75% / 90% / 100% (session-deduped). Attention lists envelopes at or above 75%.
- Screen back chevrons call `router.back()` when history exists; otherwise navigate to `backHref` (or `/home`).

## Data Model

`profiles` columns (migration `supabase/migrations/2026-07-18-onboarding-goals.sql`):

- `onboarding_completed_at timestamptz null`
- `onboarding_skipped_at timestamptz null`
- `wants_budget_help boolean null`
- `primary_goals text[] not null default '{}'`

Allowed goal keys: `save_more`, `increase_wealth`, `budget_tracking`, `decrease_expenses`, `pay_debt`, `give_generously`, `build_emergency_fund`.

## Validation

- Apply the migration on the app Supabase project before relying on profile goal fields.
- Skip onboarding → land on Home with resume CTA; finish → profile timestamps + personalized plan/envelopes when help was requested.
- Add an expense that pushes a custom budget past 75% → toast once per threshold per session + Attention row.
- Open a pushed screen (e.g. Settings) → back returns to the previous page; deep-link refresh falls back to `backHref`.
