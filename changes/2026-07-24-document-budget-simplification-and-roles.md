# Document budget simplification + roles session

## Summary

Synced project documentation (English, same language as existing `docs/`,
`Architecture/`, and `design.md`) with the 2026-07-24 Budget simplification and
category-roles work from this chat. No product code changes in this note.

## Product Changes

Docs only. Captured product rules already shipped in code:

1. Monthly plan = expected **income** only (no protected-% UX; column still
   written as `100`).
2. Methods own the envelope split via `categories.budget_role`.
3. Budget tab: edit/delete income; no Primicias card; in-app method replace
   confirm; fixed `replace_custom_budget_set` UUID cast.
4. Home: desktop quick-action row removed.
5. Capture / import: ranked top-3 suggest + merchant-pattern learning.
6. Loan category = money lent (`loan_lent`), not savings or debt payoff.

## Data Model

Documented (already applied on live):

- `categories.budget_role`
- Migrations: `category-budget-roles`, `reclassify-insurance-cash`,
  `fix-replace-custom-budget-set-category-ids`

## Validation

Updated files:

- `docs/APP.md` — §§1, 4, 5, 8, 9, 9b, 14–15, 20
- `docs/pending-migrations-runbook.md`
- `design.md` — IA table + onboarding personalization notes
- `Architecture/01-system-overview.md`
- `Architecture/03-data-model.md`
- `Architecture/04-api-surface.md`
- `Architecture/06-domain-logic.md`
- `Architecture/07-import-pipeline.md`
- `Architecture/README.md`

Cross-links to change notes:

- `2026-07-24-remove-protected-budget-percent.md`
- `2026-07-24-visible-delete-monthly-income.md`
- `2026-07-24-remove-primicias-card-from-budget.md`
- `2026-07-24-remove-home-quick-actions.md`
- `2026-07-24-fix-method-seed-confirm-and-rpc.md`
- `2026-07-24-budget-roles-and-smarter-categorization.md`
