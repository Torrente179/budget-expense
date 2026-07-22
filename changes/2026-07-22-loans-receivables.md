# 2026-07-22 — Loans (Préstamos) receivables tracking

## Summary

Added Wealth → **Loans / Préstamos** to track money lent to people: principal, repayments, outstanding balance. Creating a loan dual-writes a **Loan** expense; recording a repayment dual-writes income. Outstanding loans count toward net worth assets.

## Product Changes

- New Wealth nav tab: **Loans / Préstamos** (`/wealth/loans`).
- Create loan (borrower, amount, currency) → records loan + expense under Loan category.
- Record repayment → reduces outstanding + income (`Loan repayment — {name}`).
- Fully repaid loans auto-close (`is_active = false`).
- Wealth overview: loans outstanding in assets, allocation donut, and jump-in links.
- Deleting a loan does **not** delete linked movements (ledger history stays).

## Data Model

- `loans`: borrower_name, principal, currency, lent_date, notes, is_active, optional `expense_id`.
- `loan_repayments`: amount (>0), repayment_date, note, optional `income_entry_id`.
- Outstanding = principal − Σ repayments.
- Migration: `supabase/migrations/2026-07-22-loans-receivables.sql` (applied to app project).
- Types: `src/types/database.ts`.
- API: `GET/POST /api/loans`, `PATCH/DELETE /api/loans/[id]`, `POST/DELETE /api/loans/[id]/repayments`.

## Validation

- Migration applied; `loans` / `loan_repayments` tables present.
- Create loan → row in `loans` + expense with Loan category.
- Repayment → `loan_repayments` + income entry; outstanding drops.
- Over-repayment rejected with 400.
- Spanish UI labels use Préstamo / Préstamos / cobros.
