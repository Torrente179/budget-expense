# 2026-07-18 — New Budget & Expense favicon

## Summary

- Replaced the previous serif, three-dimensional `BE` artwork with an original flat app mark generated for small-screen legibility.

## Product Changes

- Introduced a condensed italic white `B` on the app's near-black surface, with an emerald ledger/growth slash drawn from the existing success color.
- Updated the browser favicon, Next.js app icon, Apple touch icon, PWA install icons, and shared in-app brand image so every surface uses the same identity.

## Data Model

- No changes.

## Validation

- Reviewed the generated mark at 128px, 64px, 32px, and 16px.
- Verified the generated PNG and ICO dimensions and formats.
- `npm run build` was attempted; it is currently blocked by an existing JSX parse error in `src/components/wisdom/wisdom-screen.tsx:473` and unavailable Google Fonts network requests. Neither failure is related to the icon assets.
