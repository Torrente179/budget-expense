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

- Pending: lint, TypeScript/build validation, and browser checks at laptop and
  wide-desktop widths.
