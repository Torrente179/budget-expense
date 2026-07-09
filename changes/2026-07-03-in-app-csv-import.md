# 2026-07-03 — In-app CSV import with review, commit, and rollback (Phase 1)

## Summary
- New `/import` page: upload a Santander `movimientos.csv` (or Wise statement CSV) → the app parses it, proposes categories from `categorization_rules`, applies the Wise tithe heuristic, flags duplicates against the ledger, and shows a review screen. Nothing is written until the user confirms; every committed batch can be rolled back.
- The Python→SQL script path remains for bulk/historical imports; both paths share the same 5-field dedupe key and byte-identical description normalization, so each skips the other's rows.

## Product Changes
- Sidebar/mobile-drawer gain an **Import / Importar** entry (`FileUp` icon).
- Review screen: tab filters (all/new/duplicates/needs-category) with counts, per-row category select (a manual fix is remembered as a user rule), include/exclude switch (duplicates can be force-imported, R3), tithe-detected badge, commit/discard actions.
- Import history lists every batch with status and one-click **Roll back** for committed batches.

## Data Model
- No new migrations (Phase 0 landed them). Committed rows are inserted with `source_kind='import_csv'`, `external_ref` (sha256 of raw CSV row + index), `import_batch_id`, and `needs_review=true` when no rule matched. "Remember" corrections upsert `categorization_rules` with `source='user'`, priority 5 (beats seeds).

## Code Changes
- Libs: `src/lib/import/{csv,types,parse-santander,parse-wise,tithe-match,propose}.ts`, `src/lib/ledger/categorize.ts`, shared `src/lib/supabase/ledger.ts` (canonical auth/ledger resolution extracted from `/api/expenses`).
- API: `POST|GET /api/import/batches`, `GET|PATCH|DELETE /api/import/batches/[id]`, `POST .../commit` (re-runs dedupe server-side at commit; 409 on double-commit), `POST .../rollback` (deletes by `import_batch_id`).
- UI: `src/app/(app)/import/page.tsx`, `src/components/import/{import-dropzone,import-review,import-history}.tsx`, `src/hooks/use-import-batches.ts` (react-query; commit/rollback invalidate expenses/incomes/summary).

## Validation
- `npm run check:parity` passes both gates: normalize parity (20 concepts) and **end-to-end import parity** (`scripts/check-import-parity.mjs`): a 12-row synthetic CSV produces identical expenses (7), incomes (4), tithe assignments (3), skip counts, categories, and descriptions in Python and TS. The script also accepts a real CSV path as arg for a live comparison.
- `npx tsc --noEmit` clean; `npm run build` compiles all new routes; lint errors unchanged from baseline (5 pre-existing).
- Live flows (upload → review → commit → rollback, cross-path idempotency with the Python SQL) pending DB restoration — see `docs/pending-migrations-runbook.md`; the commit endpoint hard-requires the Phase 0 migrations.
