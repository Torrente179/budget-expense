# Import Banco de Occidente July screenshots

## Summary

- Transcribed three Banco de Occidente movement screenshots covering July 2-17, 2026.
- Added a row-level audit CSV and duplicate-safe SQL import for `doralisderamirez@gmail.com`.
- Applied the verified rows to the live Supabase project.

## Product Changes

- Added 34 expenses totaling COP 3,262,969.88.
- Added 17 income entries totaling COP 1,752,489.50.
- Preserved repeated legitimate interest credits, including three identical July 6 rows and four identical July 14 rows.
- Categorized Kairós and the identified restaurant charge as `Food & Dining`, Terpel as `Transportation`, Cruz Verde as `Healthcare`, D1/Ara as `Groceries`, Apple as `Subscriptions`, Movistar as `Utilities`, and GMF as `Taxes`.
- Kept generic outgoing bank transfers and unidentified electronic-service payments in `Other`.

## Data Model

- No schema changes.
- The import writes to the existing `expenses`, `income_entries`, and `categories` tables.

## Validation

- Visually reviewed all three screenshots at original resolution and resolved their date-boundary overlaps without dropping rows.
- Confirmed the audit CSV and SQL contain the same 51 rows, field for field.
- Confirmed four pre-existing July 1 expenses were separate from the screenshots and were left unchanged.
- Queried the live database by date; every July 2-17 expense/income count and total matches the screenshot transcription.
- Reran the SQL and confirmed live totals remained unchanged: 38 July 1-17 expenses totaling COP 4,518,123.88 including the four pre-existing rows, and 17 screenshot income entries totaling COP 1,752,489.50.
