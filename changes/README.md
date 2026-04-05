# Changes Log Policy

This folder tracks implementation history for this project.

## Required
- Every code, schema, or configuration change must create one markdown file in this folder.
- File naming format: `YYYY-MM-DD-short-kebab-title.md`
- One logical change per file.

## Minimum Structure
Each change note should include:
- `Summary`
- `Product Changes` (if applicable)
- `Data Model` (if applicable)
- `Validation`

## Template
Use this template:

```md
# YYYY-MM-DD — Short descriptive title

## Summary
- What changed and why.

## Product Changes
- UI, UX, and behavior updates.

## Data Model
- DB schema, migrations, policies, or type updates.

## Validation
- Commands executed and outcomes (lint/build/tests).
```

## Current Entries
- `2026-04-01-initial-build.md`
- `2026-04-01-fix-client-env-crash.md`
- `2026-04-01-fix-signup-failed-to-fetch.md`
- `2026-04-01-fix-email-confirmation-redirect.md`
- `2026-04-01-nextjs-16-upgrade.md`
- `2026-04-01-luxe-ledger-ui-refresh.md`
- `2026-04-01-stewardship-budget-upgrade.md`
- `2026-04-01-investments-ledger.md`
- `2026-04-01-mobile-dashboard-mobile-first.md`
- `2026-04-01-bilingual-localization.md`
- `2026-04-01-mobile-nav-and-analytics-polish.md`
- `2026-04-01-recurring-monthly-charges.md`
- `2026-04-01-total-income-expense-ledger.md`
- `2026-04-01-investment-savings-transfers-and-net-worth.md`
- `2026-04-01-investments-section-pages-split.md`
- `2026-04-04-fix-mobile-expense-sheet-scroll.md`
- `2026-04-04-fix-supabase-missing-feature-tables.md`
- `2026-04-04-rebuild-santander-csv-import.md`
- `2026-04-04-prefill-santander-import-user-id.md`
- `2026-04-05-fix-expense-income-server-read-path.md`
- `2026-04-05-add-bearer-fallback-for-internal-api-auth.md`
- `2026-04-05-rebuild-expenses-page-around-server-ledger-data.md`
- `2026-04-05-bridge-ledger-project-for-expenses-and-incomes.md`
