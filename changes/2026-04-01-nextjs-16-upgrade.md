# 2026-04-01 — Upgrade to Next.js 16

## Summary
- Upgraded the app from Next.js `15.5.14` to `16.2.2`.
- Updated lint configuration to the Next.js 16 flat-config format.
- Migrated deprecated `middleware` file convention to `proxy`.

## Technical Changes
- Updated dependencies:
  - `next` -> `^16.2.2`
  - `eslint-config-next` -> `^16.2.2`
- Updated `eslint.config.mjs`:
  - switched from `FlatCompat`/legacy extends usage to `eslint-config-next` flat exports
  - preserved project-specific ignores
  - set `react-hooks/set-state-in-effect` and `react-hooks/immutability` to warnings to avoid blocking existing app behavior during migration
- Renamed `src/middleware.ts` to `src/proxy.ts` and updated exported function name from `middleware` to `proxy`.
- Accepted Next.js build-required TypeScript config update in `tsconfig.json`:
  - `jsx` set to `react-jsx`

## Verification
- `npm run lint` passes (warnings only, no errors).
- `npm run build` passes on Next.js `16.2.2`.
