# 2026-07-22 — Loan category banknote icon

## Summary

Loan category icon changed from `hand-coins` to `banknote` (billete). Spanish label remains **Préstamo**.

## Product Changes

- Category picker / badges show a banknote icon for Loan / Préstamo.

## Data Model

- Updated global Loan row `icon` to `banknote` (migration `2026-07-22-loan-category.sql` retags existing row).
- App: `DEFAULT_CATEGORIES`, Lucide `banknote` → `Banknote` in `category-badge.tsx`, Santander import defaults.

## Validation

- Supabase: `categories` where name = Loan has `icon = banknote`.
- Spanish locale displays **Préstamo**.
