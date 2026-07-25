# Session record: Presupuesto tiles, black heroes, budget wizard

## Summary

Documentation pass covering one working session (2026-07-24 → 25). Four
shipped changes and two analyses; each shipped change already has its own note,
so this one records what the handbook and Architecture set now say, and — more
importantly — the problems the analyses surfaced that are **still open**.

Commits: `4f3bd48`, `2e2cfc1`, `4966638`, `d2606d5`.

## Product Changes

Recorded here, detailed in their own notes:

| Change | Note |
|---|---|
| Home Presupuesto tiles, three across + carousel | `2026-07-24-home-budget-cards-mockup-grid.md` |
| Black month-hero surface (Home + Budget) | `2026-07-24-black-hero-surface.md` |
| `BudgetWizard` centered modal + two new columns | `2026-07-25-budget-wizard-modal.md` |

Documentation updated in this pass:

- **`design.md`** — Home described as a black hero; §2.1.1 rewritten for the
  three-across tiles and their container-query sizing; hero tokens replace the
  "do not reuse ad-hoc blues" rule; `BudgetWizard` added to the quick reference.
- **`docs/APP.md`** — Hero summary card (black chrome, `HERO_ACCENT`,
  dark-mode lift); Presupuestos card (tiles, `%` label rule); §9 UI now
  describes the wizard's three steps, the branch fork, the honest preview, the
  overlap warning and the discard guard, plus the two new per-budget settings;
  §14 records the applied migration and its verification query; §15 code map
  gains `hero-surface.tsx`, `budget-wizard.tsx`, `CategoryGlyph`,
  `resolveAlertLadder`.
- **`Architecture/03-data-model.md`** — `warn_threshold` / `repeats_monthly`
  columns; the flat-envelope note (no `parent_id`); the overlap double-count
  gap.
- **`Architecture/05-frontend-architecture.md`** — black `HomeSummaryCard`,
  shared `hero-surface.tsx` tokens, `BudgetWizard` replacing the deleted
  `custom-budget-form.tsx`, and the two-band-systems conflict.
- **`Architecture/06-domain-logic.md`** — how Metas are actually funded (by
  expenses, no transfer link), the correct reservation formula if one is ever
  added, and the band-system conflict at its source.
- **`Architecture/09-operations.md`** — the Supabase CLI is linked but skips
  date-named migrations; when to use `apply-sql.mjs` vs `db push`; verifying
  DDL through PostgREST when Docker isn't running.

## Data Model

No new schema in this pass. The session's one migration
(`20260725000000_budget_warn_threshold_and_repeat.sql`) is applied and
documented in `docs/APP.md` §14 and `Architecture/03-data-model.md`.

## Open problems (found by analysis, not yet fixed)

1. **Envelope overlap double-counts.** One category in two envelopes inflates
   `totalConsumed`, so `unallocatedSpent` clamps to 0 and hides real unallocated
   spend, while plan distribution allocates the same euros twice. The wizard
   warns at creation; existing overlaps and edits bypass it.
   → `Architecture/03-data-model.md`.
2. **Two colour band systems for one concept.** Home 5-band (`palette.ts`) vs
   Budget/wizard 3-band (`envelope-kinds.ts`); 75% is amber on one and blue on
   the other. → `Architecture/06-domain-logic.md`.
3. **No transfer ↔ goal link.** Savings and investing progress only when
   recorded as *expenses*, which is why they reduce `Te quedan`. Any
   "reservar del disponible" feature must use `max(target − contributed, 0)` and
   must decide whether the Home headline changes.
   → `Architecture/06-domain-logic.md`.
4. **Migration tooling is half-and-half.** Two files are CLI-tracked; ~20
   date-named ones are applied by hand and invisible to
   `supabase migration list`. → `Architecture/09-operations.md`.

Also noted for whoever implements from the source mockups: the desktop and
mobile Presupuesto mockups disagree on several figures (Vivienda 93% vs 87%,
Transporte 78% vs 60%, Ahorro 100% vs 55%, Inversión 100% vs 37%) and on the
under-80% bar colour (blue vs green). Only the hero figures match.

## Validation

Documentation only — no code, config, or schema changed in this pass. Claims
were checked against the files they describe rather than from memory; the
migration status was verified against the live project earlier in the session
(`supabase migration list` local+remote, PostgREST 200/400 control).
