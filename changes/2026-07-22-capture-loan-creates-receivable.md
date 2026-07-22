# 2026-07-22 — Capture Loan category creates Wealth loan

## Summary

Choosing the **Loan / Préstamo** category when adding a movement now asks for a borrower name and creates the matching receivable under Wealth → Loans (dual-write stays a single expense).

## Product Changes

- Capture (create): Loan category → required **Borrower / Persona** field; save goes through `/api/loans` (expense + loan).
- Capture (edit): if category is Loan and a borrower is entered, links a loan to the existing expense when one is not already linked.
- Hint copy: also tracked under Wealth → Loans / Patrimonio → Préstamos.
- Undo on loan capture deletes loan **and** linked expense (`?delete_expense=1`).

## Data Model

- No schema change. Uses existing `loans.expense_id` link.
- `POST /api/loans` accepts optional `expense_id` to link without creating another expense.
- `DELETE /api/loans/[id]?delete_expense=1` removes the linked expense for undo.

## Validation

- New Loan expense with borrower appears in Movements and Wealth → Préstamos.
- Submitting Loan without borrower is blocked on create.
- Undo removes both loan and expense.
