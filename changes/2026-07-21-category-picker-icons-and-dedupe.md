# 2026-07-21 — Category picker icons, surface distinction, and dedupe

## Summary
- Category selects (capture sheet, recurring, review, import, budget envelopes) now show icons and use a solid elevated menu surface so the submenu reads apart from the parent sheet/dialog.
- Removed duplicate **Personal Care** and **Taxes** rows from Supabase by merging user-scoped copies into the matching global categories.
- Import generator no longer creates user-owned categories when a global row with the same name already exists.

## Product Changes
- Capture / edit expense category field: icon + label in the trigger and in the dropdown.
- Category dropdown uses a solid `bg-card` elevated surface (`shadow-3`) and a slightly tinted trigger so it separates from the sheet chrome.
- Settings classification list and other pickers show translated names with icons where applicable.
- Missing Lucide mappings added for `church`, `landmark`, `briefcase`, `heart-handshake`, `sparkles`, `hand-heart`.

## Data Model
- Applied `supabase/imports/2026-07-21-dedupe-categories.sql`:
  - Personal Care user row → global `3ec200f0-…` (14 expenses total).
  - Taxes user row → global `d48ec116-…` (112 expenses total; keeps `essential`).
- Client-side `useCategories` also dedupes by normalized name (prefer global) as a safety net.
- `scripts/generate_occidente_import.py`: existence check now treats any global/user row with the same name as already present; lookup prefers global.

## Validation
- Supabase query after merge: no duplicate category names; expense counts match pre-merge sums.
- Category pickers render icons for defaults and import-added categories (Taxes, Donations, Tithe, etc.).
