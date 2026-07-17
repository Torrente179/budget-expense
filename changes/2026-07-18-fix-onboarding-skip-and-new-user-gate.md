# Fix onboarding skip bounce and limit force-gate to new users

## Summary

Skip was bouncing users back into the wizard because `OnboardingGate` and the wizard each kept separate onboarding state. Skip is now on every step, shared via React Query + a session dismiss flag, and the force-gate only applies to accounts created on/after the onboarding feature launch.

## Product Changes

- **Skip for now** on welcome, income, recurring, debt, goals, and suggestions.
- Skip persists immediately (optimistic cache + `sessionStorage`) so navigating to Home cannot re-open the wizard in the same session.
- Force redirect to `/onboarding` only for new profiles (`created_at >= 2026-07-18`); existing users are never trapped in the wizard.
- Middleware login/signup redirect uses the same new-account rule.

## Data Model

None (uses existing `onboarding_*` profile columns).

## Validation

- `npx tsc --noEmit` passes.
- Manual: new signup → Skip on a mid-wizard step → stays on Home; existing primary account is not force-gated.
