# Document balance adjustment movements

## Summary

Synced project documentation (English) with the 2026-07-24 behavior where a
non-zero available-balance reconciliation delta is booked as a dated ledger
movement with standard bilingual names.

## Product Changes

Documentation only — no runtime behavior change in this note.

Updated:

- `docs/APP.md` — Settings available-balance flow (§10b), Movements note,
  key code map, related change notes
- `Architecture/README.md` — write-path and reconciliation bullets
- `Architecture/03-data-model.md` — checkpoint companion ledger write
- `Architecture/04-api-surface.md` — `POST /api/balance-checkpoints` contract
- `Architecture/06-domain-logic.md` — §6.4 booking + ordering invariant
- `Architecture/10-architectural-decisions.md` — AD-8 revised

## Data Model

None.

## Validation

- Spot-check docs against `changes/2026-07-24-balance-adjustment-movements.md`
  and `src/app/api/balance-checkpoints/route.ts`
