# 2026-04-04 — Fix mobile expense sheet scroll reachability

## Summary
- Fixed the mobile Add Expense composer so users can always reach the primary save action.
- The bottom sheet now uses a concrete mobile height and a shrinkable scroll region, preventing content clipping that previously hid the footer actions.

## Product Changes
- Updated `src/components/expenses/expense-form.tsx`:
  - Set explicit mobile bottom-sheet height/max-height using viewport units (`90vh` fallback and `90dvh` override).
  - Added `min-h-0` to the form container and scroll body so the internal content area can scroll correctly inside the constrained sheet.

## Data Model
- No data model changes.

## Validation
- `npm run lint` passes.
- Existing repository lint warnings remain in unrelated files; no new errors were introduced by this change.
