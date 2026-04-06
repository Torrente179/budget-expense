# Import Expenses from Santander CSV

## Summary
Generated a comprehensive SQL import script to bulk-insert ~380 expenses from a Santander bank CSV export (movimientos.csv) covering Oct 2025 – Apr 2026. Each transaction was individually analyzed and reclassified with cleaned-up descriptions. Script was executed against production Supabase (user `36534d1b-8f48-4b5c-8693-aae1673a222c`).

## Product Changes
- Created SQL import script (`import-expenses.sql`) for Supabase SQL Editor execution
- 4 new user-scoped expense categories added to production database:
  - **Taxes** (landmark / #b91c1c) — Autónomo Social Security (TGSS), AEAT tax payments
  - **Professional Services** (briefcase / #0369a1) — Gysecan accountants, Notaría, legal consulting
  - **Donations** (heart-handshake / #d97706) — Church offerings (Vida Nueva), family support (Wise EUR)
  - **Personal Care** (sparkles / #c026d3) — Douglas, Druni, barber (Miguel Ángel)
- Extensive reclassification of bank-assigned categories for accuracy:
  - HiperDino (HD) → Groceries (bank said "Restaurante")
  - Tienda D1 → Groceries (bank said "Restaurante")
  - EDS/Adana Demar/Disa gas stations → Transportation (bank said "Restaurante")
  - Dollarcity → Shopping (bank said "Restaurante")
  - Claude.ai / OpenAI / Apple iCloud / VPN / Uber One → Subscriptions (bank said various)
  - Emma Sleep mattress → Shopping (bank said "Supermercado")
  - Serviteca auto service → Transportation (bank said "Restaurante")
  - Fogata Llanera restaurant → Food & Dining (bank said "Supermercado")
  - Ananda Taller Dulce bakery → Food & Dining (bank said "Mantenimiento vehículo")
  - Recaudación EMV Madrid → Transportation (bank said "Restaurante")
- Bizum/transfer entries reclassified by concepto context:
  - "concepto: cine" → Entertainment
  - "concepto: café y tarta / comidirri / pinsa" → Food & Dining
  - "concepto: sicóloga nerina" → Healthcare
  - "concepto: house consumables" → Groceries
  - "concepto: juan pablo corte pelo" → Personal Care
  - "concepto: renta" → Housing
  - "vida nueva - ofrendas" → Donations
  - "juan wise euro" (family) → Donations
- Filtered out: income entries (Ingreso), internal transfers (No computable), refunds (positive-amount Gasto)
- Cleaned all merchant descriptions from raw bank format to human-readable names

## Data Model
- 4 new categories created with `user_id = '36534d1b-...'` (user-scoped, not default)
- ~380 expense rows inserted per script run, all EUR currency
- Dates derived from "Fecha de operación" (actual transaction date, not bank processing "Fecha valor")
- No schema migrations required — used existing `expenses` and `categories` tables

## Source Data
- File: `movimientos.csv` (Santander Spain export)
- Format: European CSV — comma decimal (`-7,85`), period thousand separator (`1.470,80`)
- Date format: DD/MM/YY (e.g. `1/4/26` = April 1, 2026)
- Columns used: Fecha de operación, Importe, Moneda, Concepto, Tipo de movimiento, Categoría
- Columns ignored: Fecha valor, Entidad, Nombre de producto, Tipo de producto, Nota

## Execution Log
- Script was run multiple times in Supabase SQL Editor, resulting in ~976 rows (duplicates)
- Deduplication query provided to clean up:
  ```sql
  DELETE FROM expenses
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, amount, date, description, category_id) id
    FROM expenses
    ORDER BY user_id, amount, date, description, category_id, created_at ASC
  );
  ```
- Frontend initially did not reflect data — confirmed data exists via diagnostic queries
- Root cause of display issue under investigation (RLS policies verified correct, data confirmed present)

## Validation
- Category creation is idempotent (checks existence before inserting)
- All amounts are positive decimals (as required by `amount > 0` constraint)
- All dates in YYYY-MM-DD format (as required by schema validation)
- Script runs as a single DO $$ transaction (atomic: all-or-nothing)
- Diagnostic queries confirmed: 12 default categories present, 4 new categories created, 976 expense rows inserted
