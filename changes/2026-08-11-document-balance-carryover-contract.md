# 2026-08-11 — Document the balance carryover contract

## Summary

- Added one canonical guide for Home's cross-month available-balance behavior.
- Reconciled the product handbook, design source of truth, architecture report,
  root README, and testing guidance with the shipped app logic.
- Preserved older dated change notes as historical records instead of rewriting
  what the product did at those times.

## Product Changes

- Documentation now clearly separates carried cash, monthly plan remainder,
  monthly net flow, and net worth.
- The guide records Home and Budget surface ownership, user-visible fallbacks,
  negative-balance behavior, future/past month behavior, and the July-to-August
  regression example.
- Added a troubleshooting checklist for checkpoint dates, movement ordering,
  signed savings transfers, missing FX, and stale cached snapshots.

## Data Model

- No schema or data changes.
- Documented that carryover is derived from an existing checkpoint and later
  ledger movements; there is no rollover row, transfer job, cron, or monthly
  mutation.
- Documented the primary `prepare_month_snapshot` contract and the legacy API
  adapter path.

## Documentation Coverage

- `docs/balance-carryover.md` — canonical behavior and engineering contract.
- `README.md`, `docs/APP.md`, and `design.md` — product entry points and current
  surface ownership.
- `Architecture/01` through `10` where balance flow, data access, UI ownership,
  caching, tests, or architectural decisions are affected.

## Validation

- Checked all relative Markdown links in changed documentation.
- Searched canonical docs for stale claims that Home's headline is only
  `income − spent`.
- Ran `git diff --check`.
- Re-ran `npm run test:home` and `npm run test:balance`.
- Ran `npx tsc --noEmit` successfully.
