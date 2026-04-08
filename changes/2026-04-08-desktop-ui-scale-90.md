# 2026-04-08 — Desktop UI scale set to 90%

## Summary
- Added a desktop-only global UI scale so the interface renders at the equivalent of 90% browser zoom.
- Kept mobile behavior unchanged by scoping the rule to desktop breakpoints.

## Product Changes
- On desktop widths (`>=768px`), the app now renders smaller and denser, matching your preferred 90% zoom feel.
- Added cross-browser fallback:
  - Uses `zoom: 90%` where supported.
  - Falls back to `html { font-size: 90%; }` when `zoom` is not supported.

## Data Model
- No changes.

## Validation
- Confirmed change is isolated to `src/app/globals.css` and does not alter feature logic or data flow.
- Change was reviewed against existing `changes/` notes to avoid conflicts with prior mobile-first layout work.
