# 2026-04-22 — Favicon and install icons

## Summary

- Replaced the site icon set with a cropped version of the new Budget & Expense brand image and wired it into Next.js metadata and manifest handling.

## Product Changes

- Added a renamed canonical icon asset at `public/icons/budget-expense-app-icon.png`.
- Updated the App Router metadata so the site now exposes:
  - a browser favicon
  - a high-resolution app icon
  - an Apple touch icon for Safari "Add to Home Screen"
  - a web app manifest for Android/Chrome install flows
- Set the install manifest name, short name, and theme/background colors to match the new icon styling.

## Data Model

- No changes.

## Validation

- `npm run build`
