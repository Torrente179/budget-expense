# Natural voice copy pass

## Summary

Rewrote user-facing EN/ES copy so the app sounds warm and plain-spoken
(stewardship voice from `design.md`) instead of generic SaaS or encyclopedia AI.

## Product Changes

- Auth: shorter login/signup lines; meta description reframed as a private ledger
- Onboarding & Budget first-run: less “wizard kit,” more concrete setup language
- Home / Attention / Review / Giving: cut motivational gloss and alert boilerplate
- Insights & Wealth: plain labels (budget use, cash runway, by currency, etc.)
- Settings: “Danger zone” → direct delete-account wording
- Wisdom library + budgeting methods: shorter intros and method blurbs (EN + ES)

## Data Model

None.

## Validation

- `npx tsc --noEmit` passes
- Spot-check high-traffic screens in EN and ES (auth, onboarding, Home, Budget,
  Review, Insights, Wisdom)
