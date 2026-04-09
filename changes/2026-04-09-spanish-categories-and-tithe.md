# Spanish Category Translations & Tithe / Diezmo Category

## Summary

Added Spanish translations for all expense categories so Spanish-locale users see native category names. Introduced a new "Tithe / Diezmo" category under Giving & stewardship. Updated the Santander import script to auto-detect the monthly tithe transfer (the Wise transfer closest to 10% of income) and classify it separately from regular donations and other Wise transfers.

## Product Changes

- **Spanish category names**: All 16 existing categories (12 default + 4 custom) now display their Spanish equivalent when the app locale is set to Spanish (e.g., "Food & Dining" becomes "Alimentacion y Restaurantes", "Groceries" becomes "Supermercado").
- **New category: Tithe / Diezmo**: A dedicated category for tithe tracking, displayed as "Diezmo" in Spanish. Automatically detected by the Giving & stewardship insights card (matches on "tithe" and "diezmo" keywords).
- **Wise transfer reclassification**: Transfers to Wise are no longer auto-classified as "Donations". Instead, the monthly Wise transfer closest to 10% of income is classified as "Tithe / Diezmo". All other Wise transfers default to "Other".
- **`--monthly-income` flag**: New CLI argument for the Santander import script to manually specify monthly income when the CSV doesn't contain salary data (e.g., partial-month imports).

## Data Model

- New custom category row: `Tithe / Diezmo` (icon: `church`, color: `#10b981`, is_default: false).
- No schema changes; the category is inserted via the existing `CUSTOM_CATEGORIES` mechanism in the import script.

## Validation

- `npx next build` passes with zero errors.
- All 14 UI components that display category names updated to use `tc()` translation function.
- Python import script tested: `"wise euro"` removed from Donations patterns; `assign_tithe_from_wise_transfers` post-processes expenses per month.
