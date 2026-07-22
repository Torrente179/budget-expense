# 2026-07-22 — Loan / Préstamo category

## Summary

Added a global **Loan** expense category for money lent to other people. Lends can be tagged in capture, import, and movements. A dedicated Wealth → Loans receivables space (with dual-write to expense/income) is deferred.

## Product Changes

- New default category **Loan** (Spanish: **Préstamo**), icon `banknote`, teal `#0f766e`.
- Default classification: **savings** (asset-like; retaggable in Settings).
- Keep Loan off custom budgets so it does not consume budget pace.
- Home **Spent** still includes Loan expenses for now (no lifestyle exclusion in this MVP).
- Usage today: lend → expense under Loan; repay → income with a clear source (e.g. “Loan repayment — Ana”) until Phase 2 links them.

## Data Model

- New global category row: `user_id NULL`, `name = Loan`, `is_default = true`, `classification = savings`.
- Migration: `supabase/migrations/2026-07-22-loan-category.sql` (idempotent insert + retag).
- Seed mirrored in `supabase/migration.sql` defaults + savings classification backfill.
- App constants: `DEFAULT_CATEGORIES` + `CATEGORY_LOCALIZATIONS` in `src/lib/constants.ts`.
- Lucide map: `banknote` → `Banknote` in `src/components/shared/category-badge.tsx`.
- Import generator: `Loan` added to `DEFAULT_CATEGORIES` in `scripts/generate_santander_import.py`.

## Validation

- Apply `2026-07-22-loan-category.sql` on both Supabase projects; Loan appears once in category pickers.
- Spanish locale shows **Préstamo**.
- Create an expense with Loan; do not attach Loan to a custom budget envelope.
- `useCategories` dedupe keeps a single Loan row if a user-scoped copy ever exists.
