# Deduplicate Imported Expenses & Add Last-Edited Indicator

## Summary
Removed 1,436 duplicate expense rows caused by the Santander CSV import script being run multiple times with evolving versions. Added a "last edited" timestamp indicator on the expenses page so the user can see when expenses were last logged or modified. Added an admin deduplication API endpoint for future use.

## Product Changes
- **Expenses page header** now shows a "Last logged" / "Última edición" timestamp next to the expense count and total, indicating when any expense was last added or modified across all months.
- **Expense cards** now show an "edited" badge with date when an expense has been updated after creation.
- **Admin dedup API** (`POST /api/admin/deduplicate`) available for future use — authenticates the caller, then uses the service-role client to find and remove duplicate expenses by matching (amount, date, description, category_id, currency) groups and keeping the earliest batch.

## Data Model
- No schema changes.
- **Data cleanup performed directly on the ledger project** (`bahkswifojxcnesfcqbs`):
  - Phase 1: Removed 976 rows that were exact duplicates from re-running the same import script version (3 runs → kept first run only).
  - Phase 2: Removed 460 rows from a second script version that overlapped with the cleaned first version. Kept the first version's clean descriptions; supplemented with second version entries for Sep 2025 and Oct 2025 (months the first version missed).
  - Final state: **663 expenses** (vs 664 in the CSV — 1 Sep entry missing from both import batches). Monthly totals now align with the original `movimientos.csv`.

## Validation
- Cross-referenced final DB counts against raw CSV parsing: counts match for 7/8 months (Sep off by 1).
- Monthly EUR totals after dedup: Sep 866, Oct 2,944, Nov 2,686, Dec 2,595, Jan 1,967, Feb 3,226, Mar 2,748, Apr 11.
- Total: EUR 17,042 across 663 expenses (CSV: EUR 17,257 across 664).
- Build passes (`next build` succeeds with no type errors).
- Dedup scripts preserved in `scripts/` for audit trail.
