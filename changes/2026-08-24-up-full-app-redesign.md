# 2026-08-24 — UP-derived full-app redesign

## Summary

- Completed the approved UP-derived presentation propagation after the core
  checkpoint: Wealth and every drilldown, Insights and drilldowns, Review,
  Import, Wisdom, Settings/profile/command surfaces, landing/auth chrome, and
  the full onboarding experience now share the same ink, white-sheet, coral,
  dense-row system.
- Reused the supplied screenshots and GIF only as private reference evidence.
  No UP brand, captured copy, screenshot, GIF, or proprietary asset ships in
  the product.
- Preserved all routes, bilingual behavior, financial calculations, Supabase
  reads/writes, filters, wizards, undo paths, and workflow contracts.

## Product Changes

- Added `ContinuousSheet` and `SheetSection` as the canonical uninterrupted
  white content plane, replacing top-level galleries of generic lifted cards.
- Rebuilt Wealth around one dominant net-worth chrome surface flowing into a
  continuous asset/debt sheet with dense category rows, trend/cushion analysis,
  FX context, and unchanged account/savings/investment/loan/liability flows.
- Rebuilt Insights as one month-spend chrome hero followed by a divided report
  for trends, Trackers, anomalies, monthly analysis, giving, income sources,
  calendar, and category detail. No unsupported Quarter/Year controls were
  introduced.
- Converted Review, Import, Wisdom, Settings, profile, command, popover, menu,
  and Wealth drilldown surfaces to opaque, flat rows/sheets. Import continues
  to identify Santander and Wise.
- Extracted `OnboardingStoryShell`: full-screen coral storytelling with
  accessible ink-backed lemon display type and an opaque white form surface.
  The live six-step wizard retains its validation, skip/resume, personalization,
  and write behavior.
- Expanded the fail-closed `/__design/up` harness to render production Wealth,
  Insights, and onboarding components in addition to the checkpoint screens.
  The same deterministic loading, empty, error, overspent, completed-goal,
  long-Spanish, large-number, negative, and multi-currency fixtures remain.
- Removed the unused `next-themes` dependency and the remaining decorative
  glass, gradient, and drop-shadow treatments. All visible interaction targets
  are at least 44px at phone, tablet, and desktop review sizes.
- Added local tablist keyboard focus scoping, named progress meters, accessible
  wealth label contrast, and focus-return verification for contextual sheets.

## Data Model

- No Supabase schema, migration, RLS policy, external API, financial formula,
  route URL, query key, mutation contract, or stored-data behavior changed.
- No automatic-transfer or bank-Saver engine was introduced; Savers continue
  to present existing `contribution_goal` data.

## Validation

- Browser-reviewed populated, long-Spanish, large-number, negative, Wealth,
  Insights, onboarding, and contextual-sheet states at 375×667, 390×844,
  768×1024, and 1440×900: no horizontal overflow or framework overlay; ≥44px
  targets; contextual sheet focus returns to its initiator.
- Axe passes across all four target viewports after fixing the expanded
  harness findings.
- `npx tsc --noEmit` and `npm run lint` pass; lint retains 12 documented
  warnings and zero errors.
- `npx next typegen` passes. Balance 8/8, Home 4/4, Wealth 22/22, and
  recurring-date 4/4 tests pass; both normalizer/import parity checks pass.
- The final non-updating `npm run test:e2e` run passes 17 checks with three
  intentional normal-motion skips outside the 390×844 reference phone. It
  covers committed screenshots, axe, all fixture stress states, touch targets,
  overflow, runtime errors, production-component propagation, and the 650ms
  motion ceiling.
- `npm run build` compiles and generates all 57 static pages successfully.
  `/__design/up` returns 404 with no enable flag and also returns 404 when the
  flag is present under `VERCEL_ENV=production`; enabled preview coverage is
  exercised by Playwright.
- `git diff --check` passes before the completion commit.
