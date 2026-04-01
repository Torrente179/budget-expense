# 2026-04-01 — Bilingual localization rollout (ENG/ESP)

## Summary
- Added a full user-selectable English/Spanish experience across auth, navigation, dashboard, budgets, expenses, investments, settings, and wisdom.
- Introduced a persistent language preference so users can switch between `ENG` and `ESP` and keep their choice across sessions.
- Localized core UI copy, labels, actions, table headers, status text, and helper messaging without changing product logic.
- Split biblical finance content by locale so English uses `ESV` / `NIV` source families and Spanish uses `NBLA` / `NVI`.

## Localization System
- Added a new locale context provider in `src/providers/locale-provider.tsx` with:
  - `locale` state (`en`/`es`)
  - `t(english, spanish)` helper
  - persistence to `localStorage` and cookie (`be_locale`)
  - automatic `<html lang>` synchronization
- Added a reusable language selector component in `src/components/shared/language-switch.tsx`.
- Wired locale provider globally in `src/app/layout.tsx`.
- Added language switch entry points in:
  - `src/components/layout/topbar.tsx` (app shell)
  - `src/app/(auth)/layout.tsx` (login/signup screens)

## Formatting & UX Details
- Extended `src/lib/utils.ts` with locale-aware helpers:
  - `resolveAppLocale`
  - `getIntlLocale`
  - locale-aware `formatDate`, `formatCurrency`, and `getMonthName`
- Updated date/currency render surfaces to respect selected locale formatting where applicable.
- Updated auth page metadata titles to bilingual variants for clearer context.
- Rebuilt `src/lib/biblical-wisdom.ts` into a locale-aware content source with translation metadata and source links for the wisdom page and dashboard preview.

## Verification
- `npm run lint` passes.
- `npm run build` passes.
