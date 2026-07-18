# 2026-07-18 — Document brand icon system

## Summary

- Added the new Budget & Expense identity to the long-lived design-system documentation after auditing recent implementation commits against the change-log policy.

## Product Changes

- Documented the icon's visual meaning, canonical palette, prohibited treatments, asset ownership, supported sizes, and cross-surface consistency requirements.
- Added the brand icon specification to the design-system quick reference.
- Confirmed that each recent implementation commit already has a corresponding entry in `changes/`.

## Data Model

- No changes.

## Validation

- Verified every brand asset path and dimension against the repository.
- Audited the 12 most recent implementation commits for matching `changes/*.md` entries.
- Ran `git diff --check` for Markdown formatting errors.
