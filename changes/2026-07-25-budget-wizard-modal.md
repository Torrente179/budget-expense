# Crear presupuesto: centered wizard modal

## Summary

Replaced the single-step right-side sheet for creating and editing budgets with
a centered 3-step modal (`BudgetWizard`) that branches by engine: **Tipo →
Configuración → Revisar**. `Dialog` was already the house pattern for every
Wealth form, so the budget sheet was the outlier; a 460px side panel also had no
room for the live preview and read as "quick edit" rather than "set up a rule."

Two per-budget settings from the mockup now have schema behind them: a warning
threshold and a monthly-repeat flag.

## Product Changes

- **New** `src/components/budgets/budget-wizard.tsx`, replacing
  `custom-budget-form.tsx` (deleted — nothing else imported it).
  - Centered `Dialog` at `sm:max-w-[54rem]` on desktop, bottom `Sheet` under
    768px. Form state lives above the step switch, so Back never remounts or
    loses input.
  - **Step 1** — two choice cards; the branch accent (blue wallet / indigo
    target) carries through every later step. `Continuar` stays disabled until
    one is picked.
  - **Step 2** — form left, live preview right. The branch changes the fields
    *and* the language: a limit asks for *Límite mensual* + warning threshold,
    a goal asks for *Objetivo mensual* (importe fijo or % de ingresos, with the
    resolved estimate rendered live) and shows no threshold.
  - **Step 3** — the real card, a summary table, and the consequence block
    ("No se moverá dinero").
  - **Edit** opens at step 2 as a 2-step flow with the kind locked; changing
    engine mid-month would reclassify history.
- **The preview is honest about existing movements.** It matches the selected
  categories against this month's expenses up front, so a limit created over
  €250 of existing spend shows *63% usado* in the preview instead of *0%* and
  then jumping after save. Step 3 states it outright: "Este límite ya tiene
  250,60 € gastados este mes (63%)."
- **Overlap warning.** Picking a category that already belongs to another
  budget warns inline, naming the budget, and says plainly that the spending
  counts in both and the plan distribution will double-count it. Non-blocking —
  there are no parent/child envelopes to offer instead.
- **Discard guard.** Closing (button, X, or Escape) with unsaved input shows
  *¿Descartar los cambios?* inside the same modal.

## Data Model

Migration `supabase/migrations/20260725000000_budget_warn_threshold_and_repeat.sql`:

- `custom_budgets.warn_threshold integer null`, checked 50–99. Null keeps the
  original 75/90/100 ladder; a value warns once there, then again at 100%.
  `envelope-alerts.ts` now resolves the ladder per budget
  (`resolveAlertLadder`) instead of hardcoding it, and `EnvelopeThreshold`
  widened from `75 | 90 | 100` to `number`.
- `custom_budgets.repeats_monthly boolean not null default true` — default true
  so existing budgets keep today's behaviour.
  `copy_custom_budgets_from_previous_month` now filters on it and carries both
  new columns across.

`database.ts`, `customBudgetSchema` and `BudgetInput` updated to match.

**Applied to the linked project on 2026-07-25** via `supabase db push --linked`,
and confirmed present in the remote migration history.

Note the filename: every other migration here is date-named
(`2026-07-24-*.sql`), which the CLI **skips** — it only tracks
`<timestamp>_name.sql`. Those files have been applied by hand, so the remote
history knew about exactly one migration before this one. This file uses the
timestamp form so `db push` manages it; consider renaming the older ones if the
CLI should own them too.

### Scope note

`Destino` (linked account) and `Reservar del disponible` from the mockup are
deliberately absent: reservation would change what "Te quedan" means on Home as
well as Budget, which is a product decision that hasn't been made.

The repeat toggle acts on the manual *Copiar &lt;mes&gt;* action, not a background
job — the helper text says so rather than implying automation that doesn't
exist.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors, 13 warnings (unchanged baseline).
- `npm run build` — compiles, 52 static pages.
- Driven through a temporary preview harness (since removed) that seeded the
  categories query cache: both branches, all three steps, edit mode (2 steps,
  kind locked), light and dark, desktop modal and mobile sheet. Confirmed the
  live preview matching (`63% used`, `Includes €250.60 already recorded`), the
  `10% of €2,733.16 = €273.32` estimate, the overlap warning, the
  `80% — €320.00` threshold readout, and the step-3 reveal.
- **Bug found and fixed during verification:** Escape closed the modal without
  the discard prompt. `form.formState.isDirty` was only read inside the close
  handler, and react-hook-form's formState proxy only subscribes to what the
  *render* reads — so it always reported false. Now read during render.
- Migration applied and verified against the linked project: `migration list`
  shows it local *and* remote, and PostgREST returns 200 for
  `select=id,warn_threshold,repeats_monthly` on `custom_budgets` where a bogus
  column returns 400 — so the columns exist and the schema cache is fresh.
- Not exercised: the live Budget screen behind auth (no local session), and
  the copy RPC's new `repeats_monthly` filter, which needs two months of data.
