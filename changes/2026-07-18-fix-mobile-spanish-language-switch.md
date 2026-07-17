# Fix mobile Spanish language switch

## Summary

Spanish was effectively unreachable on mobile because the language control used a Select dropdown nested inside the profile bottom sheet (portal/z-index failures). Replaced it with a segmented ENG/ESP toggle, made the control labeled and prominent in the account sheet, and stopped date formatting from ignoring Spanish.

## Product Changes

- Language switch is now a touch-friendly ENG/ESP segmented control (works in sheets and on desktop).
- Mobile account sheet shows a clear **Language / Idioma** row.
- Locale hydration no longer overwrites a saved Spanish preference with English on first paint.
- Date headers (Movements, category drilldown) respect the active locale; `formatDate` falls back to `<html lang>`.

## Validation

- Open account sheet on mobile → tap **ESP** → UI strings and date headers switch to Spanish and persist after reload.
- Desktop topbar language control still works.
