# Custom Budgets

## Summary

Replace the single-category envelope budgeting system with named custom budgets that support fixed amounts or income-based percentages and can track spending across multiple categories.

## Product Changes

- Users can create **named budgets** (e.g. "Monthly Essentials", "Vacation Fund") instead of single-category envelopes.
- Each budget's target amount can be set as a **fixed number** or a **percentage of monthly income** (resolved from the monthly plan).
- Budgets accept **multiple categories**, and spending is tracked as the sum of all expenses in those categories for the month.
- Budget cards show target amount, spent, remaining, category pills, and a progress bar with status thresholds.
- Budgets can be edited, deleted, and copied from the previous month.
- The monthly plan form and method selector remain available for income setup and allocation guidance.

## Data Model

### New tables

**`custom_budgets`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | auth.users |
| name | TEXT | 1-120 chars |
| amount_type | TEXT | 'fixed' or 'percentage' |
| amount_value | DECIMAL(12,2) | > 0; for percentage, max 100 |
| currency | TEXT | 3-char, default EUR |
| month | INTEGER | 1-12 |
| year | INTEGER | 2020-2100 |
| created_at, updated_at | TIMESTAMPTZ | |

Unique constraint: `(user_id, name, month, year)`

**`custom_budget_categories`** (junction)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| custom_budget_id | UUID FK | custom_budgets, ON DELETE CASCADE |
| category_id | UUID FK | categories, ON DELETE RESTRICT |

Unique constraint: `(custom_budget_id, category_id)`

Both tables have RLS enabled with user-scoped policies.

## Validation

- `customBudgetSchema` (Zod): name required 1-120 chars, amount_type enum, amount_value positive (max 100 for percentage via refine), category_ids array min 1, month/year integers.
- Build verification via `npm run build`.
