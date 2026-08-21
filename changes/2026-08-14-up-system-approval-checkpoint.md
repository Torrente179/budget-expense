# 2026-08-14 — UP-derived approval checkpoint

## Summary

- Rebuilt the first visual-approval wave around the supplied UP reference
  evidence: flat ink chrome, continuous opaque white sheets, coral actions and
  money figures, restrained lemon/mint accents, dense ledger rows, and a single
  disciplined motion vocabulary.
- This is an approval checkpoint on `codex/up-system-redesign`, not a merge or
  deployment. Wealth, Insights, secondary screens, and full onboarding
  propagation remain intentionally deferred until visual approval.
- Private third-party screenshots, the GIF, UP branding, captured copy, and the
  rejected cream/liquid-glass mockups are not shipped by the application.

## Product Changes

- Added three shared screen modes: `chrome-sheet`, `dark-canvas`, and `plain`.
  Desktop command, language, and currency actions now sit in solid screen
  headers; the separate glass topbar was removed.
- Replaced the mobile liquid-glass navigation with a flat opaque 60px ink
  capsule. The five destinations and route order are unchanged, and the coral
  capture FAB remains separate above it.
- Rebuilt Home around the carried available-balance hero, compact income/spent/
  daily-guide/pace context, remaining-first Trackers, a stacked spending strip
  with ranked categories, and one continuous Upcoming/activity sheet. All
  existing Home information and calculations remain available.
- Rebuilt Movements as a dense date-grouped white ledger under a net-month hero;
  URL filters, virtualization, edit, swipe-delete, five-second undo,
  pull-to-refresh, review indicators, and FX originals are preserved.
- Rebuilt Recurring as a recurring-total hero plus chronological schedule and
  day-of-month rail while preserving every recurring mutation and date rule.
- Split Budget presentation into explicit Trackers and Savers views. Trackers
  are remaining-first and turn danger red only after the limit; Savers show
  contribution progress and positive completion. Existing plan, method,
  recommendation, warning, copy-month, wizard, and CRUD behavior is unchanged.
- Reframed Capture as an amount-first ink-to-white sheet and auth as a branded
  ink/coral entry flow without changing validation, mutation, redirect, or
  failure behavior.
- Added branded route loading, error, not-found, and global-error states; unique
  core-route metadata; and server-resolved initial document language.
- Deterministically recolored only the existing B mark's green slash to coral
  and regenerated every favicon, Apple, PWA, and in-app derivative from the
  same master. The B silhouette, proportions, and padding are unchanged.
- Added a fail-closed `/__design/up` review harness. It reuses production view
  components with deterministic populated/loading/empty/error/overspent/
  completed-goal/long-Spanish/large-number/negative/multi-currency fixtures,
  bypasses Supabase and APIs, is unlinked/noindex, and returns 404 unless an
  explicit non-production preview flag is enabled.

## Data Model

- No Supabase schema, migration, API contract, route URL, query key, mutation
  contract, financial formula, or stored-data behavior changed.
- No automatic-transfer or bank-Saver engine was introduced. Savers continue
  to render the existing `contribution_goal` envelope data.

## Validation

- Baseline before the redesign: lint passed with 17 existing warnings; Next
  type generation and TypeScript passed; balance (8), Home (4), Wealth (22),
  recurring (4), and both import-parity checks passed.
- Follow-up validation completed 2026-08-21: Next route types, TypeScript,
  production build, all four domain suites, both parity checks, and lint pass.
  Lint retains 12 existing warnings and no errors.
- Playwright and axe now cover 375×667, 390×844, 768×1024, and 1440×900.
  The approval run passes 13 checks with three intentional non-reference motion
  skips, including deterministic fixtures, screenshots, horizontal overflow,
  phone touch targets, runtime errors, axe, and the documented motion ceiling.
- The review route was checked in every gate state: enabled preview returns
  200; an absent flag or `VERCEL_ENV=production` returns 404.
