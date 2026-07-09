# 2026-07-03 — Quick-add FAB with smart defaults and optimistic add (Phase 2)

## Summary
- A global floating quick-add button (all app pages, above the mobile bottom nav) opens an amount-first sheet: amount autofocused with the numeric keypad, currency/category/date pre-filled from last use, optional description with as-you-type category suggestions from `categorization_rules`. Target flow: FAB → amount → submit in under 5 seconds.
- Submissions are optimistic: the expense appears in every cached list for its month instantly; a 5-second toast offers **Undo** (deletes the created row); failures roll the caches back with an error toast.

## Product Changes
- New FAB (`Plus`, primary, 56px) at `bottom-[5.75rem] right-4` on mobile (clear of the bottom nav) and `bottom-8 right-8` on desktop.
- Quick-add sheet (bottom sheet on mobile, right panel on desktop) with EN/ES strings, EU/US decimal input via `normalizeDecimalInput`, and a suggestion badge when a merchant rule matches.
- Last-used category + currency persist in `localStorage` (`quick-add-defaults`).

## Data Model
- None. `POST /api/expenses` now returns the created row (`{ ok, expense }`, still 201) so Undo can target its id — additive, no consumer breakage.

## Code Changes
- New: `src/components/expenses/quick-add-fab.tsx`, `quick-add-sheet.tsx`, `src/hooks/use-quick-add-expense.ts` (optimistic mutation + undo), `src/lib/capture/defaults.ts`, `GET /api/categorization/suggest` (reuses `matchCategory`).
- Modified: `(app)/layout.tsx` mounts the FAB; `/api/expenses` POST returns the inserted expense with its category join.

## Validation
- `npx tsc --noEmit` clean; `npm run build` succeeds; lint errors unchanged from baseline (5 pre-existing).
- Live stopwatch/optimistic/undo verification pending DB restoration (see `docs/pending-migrations-runbook.md`); suggestion endpoint degrades to `null` while `categorization_rules` is absent, so quick-add works even before migrations.
