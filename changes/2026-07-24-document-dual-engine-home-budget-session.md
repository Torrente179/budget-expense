# Document dual-engine Budget + Home hero session

## Summary

English handbook sync for the 2026-07-24 chat that (1) fixed Metas leaking onto
Home, (2) restored Metas on the Budget tab, (3) corrected
`prepare_month_snapshot` to return `custom_budgets.kind`, and (4) compacted the
Home / Budget blue heroes. Runtime already shipped on `main`
(`d27dc38`, `9cb53ea`); this note aligns `docs/`, `design.md`, and Architecture.

## Product Changes

Docs only in this note. Shipped product rules:

### Dual engines (`custom_budgets.kind`)

| Kind | UI name | Semantics | Where shown |
|---|---|---|---|
| `spending_limit` | **Presupuestos** | Ceiling; 100% = exceeded | Home Presupuestos card **and** Budget tab |
| `contribution_goal` | **Metas de aportación** | Floor; 100% = success | Budget tab **only** — never Home |

Methods / backfill still seed goals for giving/savings/investing roles
(`tithe`, `donations`, `savings`, `investments`, …) as `contribution_goal`.

### Root cause (Home showed Metas)

`prepare_month_snapshot` built each `customBudgets` JSON object **without**
`kind`. The client defaulted missing kind → `spending_limit`, so Ahorro /
Inversión / Bendición appeared in the Home Presupuestos carousel.

Fix: migration `2026-07-24-month-snapshot-budget-kind.sql` (applied live on
`awpygbfocmynxpadpsji`). Also patched the base performance-contracts migration
for future re-applies.

Client hardening: `resolveBudgetKind()` in
`src/lib/budgeting/envelope-kinds.ts` prefers persisted `kind`, else infers from
linked category `classification` / `budget_role`.

### Budget tab UI

- Side-by-side **Presupuestos** + **Metas de aportación**.
- Create/edit sheet: kind picker (Presupuesto vs Meta).
- Plan distribution includes both engines; recommendation still from overspent
  Presupuestos only.

Earlier note `2026-07-24-presupuestos-not-metas-ui.md` (hide Metas entirely) is
**superseded** — too aggressive vs product intent.

### Compact heroes

`HomeSummaryCard` + `BudgetSummaryHero`: tighter padding/gaps, smaller remaining
type, 88px usage ring, thinner pace bar — closer to mockup vertical density.

## Data Model

Already applied:

| Migration | Purpose |
|---|---|
| `2026-07-24-custom-budget-kinds.sql` | Column `kind` + copy/seed RPCs |
| `2026-07-24-month-snapshot-budget-kind.sql` | Snapshot payload includes `kind` |

## Commits (this chat)

| Commit | What |
|---|---|
| `d27dc38` | Restore Metas on Budget; Home Presupuestos-only; snapshot `kind` |
| `9cb53ea` | Compact Home + Budget hero density |

## Runtime change notes

- `2026-07-24-home-presupuestos-only-metas-on-budget.md`
- `2026-07-24-compact-month-hero-cards.md`
- `2026-07-24-presupuestos-not-metas-ui.md` (superseded)

Related prior dual-engine work: `2026-07-24-budget-dual-engines-mockup.md`,
`2026-07-24-home-hero-and-presupuesto-cards.md`.

## Handbook files updated in this documentation pass

- `docs/APP.md` — §1, §8–§9 dual engines + compact hero; §21 change-note index
- `docs/pending-migrations-runbook.md` — snapshot-kind migration already listed
- `design.md` — IA rows (already aligned in runtime commit; verified)
- `Architecture/01-system-overview.md` — Home / Budget owns rows
- `Architecture/03-data-model.md` — `custom_budgets.kind` + migrations
- `Architecture/05-frontend-architecture.md` — Home/Budget composition
- `Architecture/06-domain-logic.md` — dual-engine status rules + Home filter

## Validation

- Spot-check Home: only `spending_limit` in Presupuestos carousel.
- Spot-check `/budget`: Metas section present; form kind picker works.
- Confirm snapshot RPC definition contains `'kind', cb.kind`.
- Confirm heroes denser than pre-`9cb53ea` without losing metrics.
