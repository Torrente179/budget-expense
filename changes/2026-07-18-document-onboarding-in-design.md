# Document onboarding, alerts, and back nav in project docs

## Summary

Folded the 2026-07-18 onboarding / goals / envelope-alerts / back-nav work into the living project docs so future agents and engineers do not rely only on the change note.

## Product Changes

None — documentation only.

- `design.md`: IA pointer to `/onboarding`; Screen history-back rule; language controls out of Screen chrome; new §8 (first-run + goals + personalization) and §9 (in-app envelope alerts); quick-reference rows; component-tree `onboarding/` + capture toast note.
- `docs/pending-migrations-runbook.md`: pending `2026-07-18-onboarding-goals.sql` with apply/verify commands.
- `docs/vercel-supabase-handoff.md`: pointers to design §8–§9, migrations runbook, and the onboarding change note.

## Data Model

None.

## Validation

- Cross-checked documented behavior against shipped code (`OnboardingGate`, `use-onboarding`, `personalize.ts`, `envelope-alerts`, `Screen` back button, migration SQL).
