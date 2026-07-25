# Fix capture-sheet loans query key

## Summary

Restored `queryKey: ["loans"]` in the capture sheet after an accidental WIP change to `queryKeys.loans` broke the Vercel typecheck (that key was not on `main` yet).

## Validation

- `next build` / TypeScript no longer fails on `capture-sheet.tsx`.
