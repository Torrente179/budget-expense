# 2026-07-22 — Architecture report and knowledge graph

## Summary

Added a complete architecture reference for the application in a new
`Architecture/` folder (11 documents), plus a machine-readable knowledge graph at
`.understand-anything/knowledge-graph.json` for the `/understand-dashboard`
explorer.

The report documents the system granularly enough for an architect with no prior
exposure to understand how every layer works and why: request lifecycle, the
twelve architectural layers, all 25 database tables, all 28 route handlers, the
frontend and design-token system, the domain rules, the bank-import parity
contract, cross-cutting concerns, operations, and an assessment of architectural
decisions and risks.

## Product Changes

None. This change is documentation only — no application code, configuration, or
schema was modified.

## Data Model

No schema changes.

The report documents the existing model as-is: 25 RLS-enabled tables across six
domains (core ledger, budgeting, import, reconciliation, wealth, debt/receivables),
6 Postgres functions (3 trigger functions, 3 aggregate RPCs), and the 16-file
migration history.

## Files added

| Path | Contents |
|---|---|
| `Architecture/README.md` | Index, the ten load-bearing facts, scale metrics |
| `Architecture/01-system-overview.md` | Product shape, stack, deployment topology, request lifecycle, repo map |
| `Architecture/02-layered-architecture.md` | 12 layers, dependency rules, module boundaries |
| `Architecture/03-data-model.md` | All 25 tables, RLS model, triggers, RPCs, migration history |
| `Architecture/04-api-surface.md` | All 28 handlers, the shared route contract, the two data paths |
| `Architecture/05-frontend-architecture.md` | App Router, provider tree, component taxonomy, tokens, mobile rules |
| `Architecture/06-domain-logic.md` | Budget math, envelope alerts, giving, checkpoints, onboarding, loans, investments |
| `Architecture/07-import-pipeline.md` | Two-path ingestion, the parity contract, dedupe identity, commit/rollback |
| `Architecture/08-cross-cutting-concerns.md` | Auth, i18n, multi-currency, state/caching, error handling, PWA |
| `Architecture/09-operations.md` | Infra, env vars, migration workflow, hazards, scripts, testing gates |
| `Architecture/10-architectural-decisions.md` | 10 decision records + risk assessment with a recommended sequence |
| `.understand-anything/knowledge-graph.json` | 363 nodes, 1,105 edges, 12 layers, 14-step tour |
| `.understand-anything/.understandignore` | Excludes secrets, build output, personal bank-data imports |

## Validation

- **Knowledge graph:** passed the `/understand` inline validator with **0 issues**
  (43 orphan-node warnings, all expected for leaf config/doc files). 363 nodes,
  1,105 edges; every file-level node is assigned to exactly one of 12 layers; no
  dangling edge or tour reference.
- **Coverage:** all 278 scanned files are represented. Scan excluded 128 files via
  `.understandignore` (`.env*`, `.next/`, `changes/`, `supabase/imports/`, `*.csv`,
  `public/`, `scripts/__pycache__/`).
- **Report accuracy:** every architectural claim was verified against source rather
  than inferred. Route methods and line counts came from grepping
  `export async function (GET|POST|PATCH|PUT|DELETE)` across `src/app/api`; table
  and column definitions from the migration SQL; redirect targets from the stub
  files; design tokens from `globals.css`.
- **No code touched:** `git status` shows only additions under `Architecture/`,
  `changes/`, and `.understand-anything/`.

## Notes

The report's assessment section records eight risks in severity order, the largest
being the two coexisting budget models (`budgets` vs `custom_budgets`) and the
absence of CI around the existing `check:parity` and `test:balance` gates. It also
notes that the `ledgerSupabase ?? appSupabase` pattern and email-based user
resolution are now vestigial after the 2026-07-04 single-project consolidation, and
are largely removable.
