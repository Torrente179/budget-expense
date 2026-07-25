# 07 — Import Pipeline

[← Domain Logic](06-domain-logic.md) · [Index](README.md) · [Next: Cross-Cutting Concerns →](08-cross-cutting-concerns.md)

---

The import pipeline is the most technically demanding subsystem in the
application, because it must satisfy a constraint most import features never
face: **two independent implementations, in two languages, must produce
byte-identical output**.

---

## 7.1 Why there are two paths

The application ingests bank data two ways, for different reasons.

| Path | Implementation | Used for |
|---|---|---|
| **In-app import** | TypeScript, `src/lib/import/` + `src/lib/ledger/` | Day-to-day: upload a CSV, review, commit |
| **Script import** | Python, `scripts/generate_*.py` | Bulk historical backfills and reconciliation, emitting idempotent SQL |

The Python path exists because of a specific operational history. In July 2026 the
ledger was reconciled end-to-end against the **official Santander XLSX export**
after a data-loss incident, growing from 951 to 2,158 expenses and 83 to 208 income
entries, covering 2024-08 onward. The root cause of the original gaps was that
earlier imports had relied on Fintonic CSV exports, which silently drop
transactions — roughly 55 were missing, including two salary payments. The
Santander export became the source of truth, and the Python generator became the
tool for large reconciliations.

Both paths write to the same tables. Therefore both must recognize each other's
rows as duplicates.

---

## 7.2 The parity contract

This is the load-bearing constraint. [`src/lib/ledger/normalize.ts`](../src/lib/ledger/normalize.ts)
opens with an unusually direct comment:

> **PARITY IS LOAD-BEARING:** descriptions produced here must be byte-identical to
> the Python script's output, because cross-path deduplication between the
> script-generated SQL and the in-app importer matches on the description field.

Deduplication compares descriptions. If the TypeScript importer renders
`"Pago Movil En Mercadona"` and Python renders `"Pago Movil en MERCADONA"`, the
same transaction imports twice. The contract is not stylistic — it is a data
integrity requirement.

### How parity is achieved

The TypeScript port reimplements Python's *exact* string semantics, including
behaviors that differ from JavaScript defaults:

```ts
/** Python str.isupper(): true if it has cased chars and all cased are upper. */
function isUpperLikePython(token: string): boolean {
  return /\p{Lu}/u.test(token) && !/\p{Ll}/u.test(token);
}

/** Python str.capitalize(): first char upper, REST lowered. */
function capitalizeLikePython(token: string): string {
  if (token.length === 0) return token;
  return token[0].toUpperCase() + token.slice(1).toLowerCase();
}
```

Date parsing replicates Python's `strptime("%y")` two-digit-year pivot exactly:

```ts
// Python strptime %y: 00-68 → 2000s, 69-99 → 1900s
const year = yearNum <= 68 ? 2000 + yearNum : 1900 + yearNum;
```

Amount parsing handles EU format (`"1.234,56"` → `1234.56`). Matching
normalization is NFKD decomposition, combining-mark stripping, space collapse,
lowercase.

### How parity is enforced

Two npm-scripted gates:

```bash
npm run check:parity
# → node scripts/check-normalize-parity.mjs && tsx scripts/check-import-parity.mjs
```

`check-normalize-parity.mjs` runs both implementations over a shared corpus and
asserts identical output. `check-import-parity.mjs` extends the check to the full
parse-and-categorize pipeline.

**Any change to the normalizers must run this gate.** It is the only automated
correctness check in the repository besides the balance-checkpoint unit tests.

---

## 7.3 Label generation

`friendlyLabel` turns raw bank concepts into readable descriptions using an
ordered pattern list — first match wins, output capped at 160 characters.

| Raw Santander concept | Rendered label |
|---|---|
| `PAGO MOVIL EN MERCADONA, …` | `Mercadona` |
| `COMPRA EN AMAZON, …` | `Amazon` |
| `DEVOLUCION COMPRA EN ZARA` | `Refund - Zara` |
| `TRANSFERENCIA A FAVOR DE JUAN, CONCEPTO: ALQUILER` | `Transfer to Juan - Alquiler` |
| `BIZUM DE MARIA CONCEPTO: CENA` | `Bizum from Maria - Cena` |
| `INGRESO ANONIMO CONTRA CUENTA …` | `Cash deposit` |
| `RECIBO TGSS.…` | `TGSS <detail>` |

`compactSuffix` discards noise concepts — `"sin concepto"` and
`"concepto sin concepto"` normalize to `null` rather than becoming part of the
label. `smartTitle` preserves genuine acronyms (`AI`, `TGSS`, `AEAT`, `TV`, `SSP`
are force-uppercased; already-uppercase multi-character tokens are left alone).

---

## 7.4 Deduplication identity

[`src/lib/ledger/dedupe.ts`](../src/lib/ledger/dedupe.ts) defines the canonical
identity of a ledger row.

```ts
expenseKey = [ amount.toFixed(2), date, description ?? "", category_id, currency ].join("|")
incomeKey  = [ amount.toFixed(2), date, description ?? "", source,      currency ].join("|")
```

The `toFixed(2)` normalization exists so `"12.5"` and `12.50` — which arrive
differently from Postgres versus JSON versus CSV — compare equal.

This key must stay compatible with **three** implementations:

1. The `LEFT JOIN` dedupe in `scripts/generate_santander_import.py` (SQL)
2. The grouping key in `/api/admin/deduplicate`
3. The in-app import proposer

A secondary identity, `external_ref`, carries the bank's own reference where
available and provides a stronger idempotency signal when present.

---

## 7.5 The in-app flow

```
1. UPLOAD          ImportDropzone → POST /api/import/batches
                     └─ proposeImport({ supabase, userId, format, csvText })

2. PARSE           parseSantanderCsv | parseWiseCsv → ParsedMovement[]
                     └─ parseCsv → parseEuDate/parseEuAmount → friendlyLabel

3. CATEGORIZE      matchCategory(concept, bankCategory, rules)
                     ├─ merchant_keyword rules, priority ASC, substring — first hit
                     ├─ bank_category rules, exact match on normalized value
                     └─ null → "Other" fallback category

4. TITHE HEURISTIC assignTithes(rows)      (Wise only)
                     └─ pairs incoming transfers with ~10% outgoing ones

5. DEDUPE          buildExpenseDedupeKey / buildIncomeDedupeKey vs existing rows
                     └─ status: "new" | "duplicate" | "uncategorized"

6. PERSIST         import_batches { status: "pending", rows: JSONB, counts }

7. REVIEW          ImportReview — per-row include/exclude, category override,
                     filter by status (UnderlineTabs)

8. COMMIT          POST /api/import/batches/[id]/commit
                     ├─ 409 if status ≠ "pending"
                     ├─ RE-RUN dedupe (rows may have been added since upload)
                     ├─ INSERT with source_kind='import', external_ref,
                     │    import_batch_id, needs_review
                     ├─ optional “remember” → user categorization_rules using
                     │    extractMerchantPattern (short token, not full line)
                     └─ status → "committed", committed_at set

   ROLLBACK        POST /api/import/batches/[id]/rollback
                     └─ DELETE rows carrying this import_batch_id
```

As-you-type Capture suggestions use the same ranking helpers as import matching
plus history (`GET /api/categorization/suggest` → top 3). See Architecture
[06 §6.6b](06-domain-logic.md#66b-category-suggestion-ranking).

### Design properties worth noting

**The proposal is a document, not a staging table.** `import_batches.rows` is
JSONB holding the entire proposal including per-row status and user overrides.
This makes review a pure edit of one row, and makes the batch self-describing for
audit long after commit.

**Commit re-validates.** Between upload and commit a user may have added
transactions manually or committed another batch. The commit route re-queries
existing rows and re-marks duplicates — but deliberately skips rows the user
overrode (`if (row.status !== "new") continue;`), so a genuine repeat charge can be
forced through.

**Rollback is precise.** Because every inserted row carries `import_batch_id`,
undoing an import is a single delete by that column — no heuristics, no
guesswork.

**`proposeImport` is a pure read.** It performs no writes; persistence happens in
the route. This makes the proposal logic testable and re-runnable.

**Degradation is built in.** If `categorization_rules` has not been migrated yet,
the proposer catches the error and returns uncategorized proposals rather than
failing the upload.

---

## 7.6 Pagination

Both `proposeImport` and `/api/admin/deduplicate` page through existing rows in
1,000-row windows:

```ts
const pageSize = 1000;
while (true) {
  const { data, error } = await query(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  all.push(...(data ?? []));
  if (!data || data.length < pageSize) break;
  from += pageSize;
}
```

This matters at real scale: with 2,158 expenses already in the ledger, PostgREST's
default 1,000-row response limit would silently truncate the duplicate check and
let duplicates through. The pagination is not premature optimization — it is
required for correctness at the data volume this app already carries.

---

## 7.7 Supported formats

| Format | Parser | Notes |
|---|---|---|
| `santander_csv` | `parse-santander.ts` | EU dates/amounts, rich concept patterns, the primary format |
| `wise_csv` | `parse-wise.ts` | Multi-currency, both expense and income rows, tithe heuristic applies |

The format is a CHECK constraint on `import_batches.source_format`, so adding a
bank requires a migration alongside a parser — a deliberate speed bump that keeps
the enum honest.

Two Python generators exist for bulk paths: `generate_santander_import.py` (the
reference implementation and parity anchor) and `generate_occidente_import.py`
(Banco de Occidente, a COP-denominated account).

---

[← Domain Logic](06-domain-logic.md) · [Index](README.md) · [Next: Cross-Cutting Concerns →](08-cross-cutting-concerns.md)
