# Static Shell, Auth, and Region Recovery

## Summary

Removed request-header access from the root layout, pinned Vercel functions to
`dub1`, added shared app loading and link-pending feedback, excluded APIs from
the proxy, and switched server identity verification to cached-JWKS
`getClaims()`. Protected compatibility handlers now authenticate before input
validation, producing consistent unauthenticated `401` responses without a
second verification pass.

## Product Changes

App navigation can use static route output and gives immediate pending
feedback. Locale still follows an explicit stored choice or browser language
after hydration.

## Data Model

No schema or stored data changes. The retired service-role bridge is off by
default and preserved temporarily behind `ENABLE_LEGACY_LEDGER_BRIDGE`.

## Validation

TypeScript, the production build, and ESLint pass. Final local production
smoke tests returned 401 for unauthenticated Expenses, Incomes, Summary, and
Investments reads. Production region and navigation percentiles must be
verified after deployment.
