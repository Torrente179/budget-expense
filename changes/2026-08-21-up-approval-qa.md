# 2026-08-21 — UP approval checkpoint QA

## Summary

- Completed the interactive, accessibility, responsive, and production-build
  hardening required before the UP-derived visual approval gate.
- The work remains isolated on `codex/up-system-redesign`; it is not merged or
  deployed, and phase-three propagation remains paused for visual approval.

## Product Changes

- Made the private fixture page render the real production Home scaffold,
  navigation, capture action, locale/currency providers, and shared patterns
  instead of a parallel approximation.
- Added deterministic populated, loading, empty, error, overspent,
  completed-goal, long-Spanish, large-number, negative, and multi-currency
  states, with responsive review layouts at the four target viewports.
- Corrected the App Router's underscore handling by placing the physical route
  at `%5F_design/up` while preserving the public review URL `/__design/up`.
  Middleware bypasses Supabase only for that exact path; the page still fails
  closed unless explicitly enabled outside production.
- Added contrast-safe semantic coral, mint, warning, information, and muted
  text variants while retaining raw coral for money figures and ink-paired
  actions. Improved touch targets, labels, keyboard tabs, focus behavior,
  mobile overflow resistance, route loading anatomy, and list motion.
- Added Playwright screenshot, behavior, motion, and axe coverage plus scripts
  for the complete suite, focused visual runs, focused accessibility runs, and
  intentional snapshot updates.

## Data Model

- No Supabase schema, migration, policy, financial formula, query contract,
  mutation contract, route URL, or stored-data behavior changed.
- The review harness remains deterministic and performs no Supabase or API
  reads or writes.

## Validation

- `npx next typegen` and `npx tsc --noEmit --pretty false` pass.
- `npm run lint` passes with 12 existing warnings and zero errors.
- Balance 8/8, Home 4/4, Wealth 22/22, and recurring 4/4 tests pass; both import
  parity checks pass.
- `npm run test:e2e` passes 13 checks with three intentional skips for the
  normal-motion test outside the 390×844 reference phone. Coverage includes
  visual baselines, axe, all fixture states, horizontal overflow, 44px phone
  targets, runtime errors, and the 650ms motion ceiling.
- Review-route gating returns 200 only for an enabled non-production preview;
  missing flag and production environment both return 404.
- `npm run build` compiles and generates all 57 static pages successfully.
- `git diff --check` passes.
