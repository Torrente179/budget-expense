# Fix desktop Movements alignment

## Summary

Corrected the overly wide, visually uneven Movements ledger on large desktop
viewports while preserving the existing compact mobile list.

## Product Changes

- Centers Movements within a readable desktop width instead of stretching the
  ledger across the full application canvas.
- Aligns date labels with the transaction row inset so the ledger follows one
  consistent vertical grid.
- Keeps the desktop delete action in a stable trailing column and reveals it
  for keyboard focus as well as pointer hover.

## Data Model

No data model changes.

## Validation

- Targeted ESLint passed with no errors. The existing TanStack Virtual
  compiler-compatibility warning remains unchanged.
- `npm run build` passed: production compilation, TypeScript, and all 49 static
  pages completed successfully.
- The local route and responsive viewport tooling were checked, but the
  available browser profile redirects private ledger routes to login; visual
  comparison therefore used the supplied wide-desktop screenshot as the
  baseline.
