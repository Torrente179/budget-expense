# 04 — API Surface

[← Data Model](03-data-model.md) · [Index](README.md) · [Next: Frontend Architecture →](05-frontend-architecture.md)

---

## 4.1 The shared route contract

All 27 `/api` handlers follow the same five-step shape. Learning it once means
you can read any route in the codebase.

```ts
export async function GET(request: NextRequest) {
  // 1. VALIDATE — Zod parse of query params or body
  const parsed = schema.safeParse({ … });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid …" }, { status: 400 });
  }

  // 2. AUTHENTICATE — Bearer token first, cookie fallback
  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. RESOLVE LEDGER CONTEXT — prefer service-role, resolve user by email
  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;
  const supabase = ledgerSupabase ?? appSupabase;
  const effectiveUserId = ledgerUser?.id ?? user.id;

  // 4. QUERY — always filtered by the effective user id
  const { data, error } = await supabase
    .from("expenses").select(…).eq("user_id", effectiveUserId);

  // 5. RESPOND — log server-side, return a generic message
  if (error) {
    console.error("Failed to fetch expenses", error);
    return NextResponse.json({ error: "Unable to fetch expenses" }, { status: 500 });
  }
  return NextResponse.json({ expenses: data ?? [] });
}
```

**Status codes in use:** `200` success · `201` created · `400` validation failure ·
`401` unauthenticated · `404` not found · `409` conflict (e.g. committing an
already-committed import batch) · `500` server error.

**Error disclosure policy:** the real Postgres error is logged with
`console.error` and never returned. Clients receive a short generic message.
`authorizedFetch` throws on any non-2xx, so React Query surfaces failures
uniformly.

**Caching:** transactional GETs deliberately set **no** HTTP cache headers. A
comment in `/api/expenses` records why:

> No HTTP cache: the client-side react-query cache owns freshness, and a
> browser-cached response here would defeat invalidation after mutations.

---

## 4.2 Complete route inventory

28 handlers — 27 under `/api` plus the auth callback.

### Movements

| Route | Methods | Lines | Behavior |
|---|---|---|---|
| `/api/expenses` | GET, POST | 129 | GET lists a month with `categories(*)` joined, optional `categoryId` and `search` (ILIKE on description), ordered by date desc. POST validates with `expenseSchema`, normalizes blank descriptions to NULL, returns the created row with its category |
| `/api/expenses/[id]` | PATCH, DELETE | 106 | Edit sheet, swipe-delete, and the 5-second Undo action |
| `/api/incomes` | GET, POST | 221 | As above, plus optional `category_id` and `loan_id`; supplying `loan_id` records the income as a loan repayment and updates loan state |
| `/api/incomes/[id]` | PATCH, DELETE | 103 | |
| `/api/recurring/sync` | POST | 55 | Materializes active recurring charges into a month. Idempotent. Deliberately **not** on the GET read path |

### Aggregation

Home's primary aggregation path is the RLS-protected Supabase RPC
`prepare_month_snapshot(year, month, as_of)`, called by
`src/lib/data/client.ts`. The route below is the compatibility adapter used
when that RPC is missing or `NEXT_PUBLIC_USE_LEGACY_DATA_API=true`.

| Route | Methods | Lines | Behavior |
|---|---|---|---|
| `/api/dashboard/summary` | GET | 458 | Legacy Home snapshot source. Seven parallel queries plus a checkpoint lookup; returns raw unconverted rows that the client adapts to `MonthSnapshot` |
| `/api/insights/household` | GET | 385 | 12-month aggregates via three RPCs, with paginated-scan fallback |
| `/api/insights/review` | GET | 32 | Expenses flagged `needs_review` |
| `/api/insights/review/count` | GET | 28 | Count only — split out so the nav badge stays cheap |

`/api/dashboard/summary` merits detail. Its query fan-out is:

```ts
const [
  [ expenses, incomes, prevExpenses, budgets,
    monthlyPlan, investmentTransfers, prevInvestmentTransfers ],
  checkpointResult,
] = await Promise.all([
  Promise.all([ … 7 queries … ]),
  checkpointPromise,          // skipped entirely for future periods
]);
```

It computes three date-window facts before querying — `isFuturePeriod`,
`isCurrentPeriod`, and `balanceTargetDate` (the earlier of the period end and
"as of" date) — so a future month does no checkpoint work at all. For a past or
current month it chooses the latest checkpoint on/before that target, even if
the checkpoint belongs to an earlier month, then aggregates qualifying later
movements through the target. This is why tracked available cash carries across
month boundaries without a rollover write. The comment
retained from the two-project era ("Expenses and incomes live in the ledger
project; budgets, plans, and investment transfers remain in the app project")
explains why the route keeps two client handles even though both now point at the
same database. The primary RPC implements the same balance contract; see
[`docs/balance-carryover.md`](../docs/balance-carryover.md).

### Budgeting

| Route | Methods | Behavior |
|---|---|---|
| `/api/categories/[id]` | PATCH | Name, color, icon, `classification`, `budget_role` (when provided) |
| `/api/balance-checkpoints` | POST | Records a bank balance with reconciliation delta; books non-zero surplus/deficit as income/expense with standard bilingual names before inserting the checkpoint (rollback on checkpoint failure); consistency enforced by CHECK + trigger |

Budget CRUD (`budgets`, `custom_budgets`, `monthly_budget_plans`) does **not** go
through `/api` — those hooks use the browser Supabase client directly under RLS.
See [§4.4](#44-the-two-data-paths).

### Import

| Route | Methods | Lines | Behavior |
|---|---|---|---|
| `/api/import/batches` | POST, GET | 92 | POST parses an uploaded CSV, runs `proposeImport`, persists a `pending` batch |
| `/api/import/batches/[id]` | GET, PATCH, DELETE | 197 | Read with proposed rows; PATCH row overrides; DELETE a pending batch |
| `/api/import/batches/[id]/commit` | POST | 271 | Inserts accepted rows into the ledger |
| `/api/import/batches/[id]/rollback` | POST | 89 | Deletes rows carrying this `import_batch_id` |
| `/api/categorization/rules` | POST | 52 | Creates a user rule (keyword preferably from `extractMerchantPattern`) |
| `/api/categorization/suggest` | GET | — | Ranked top-3 category suggestions (rules + history) for CaptureSheet |

The commit route re-runs deduplication at commit time rather than trusting the
proposal — rows may have been added between upload and commit:

```ts
if (batch.status !== "pending") {
  return NextResponse.json({ error: `Batch is already ${batch.status}` }, { status: 409 });
}
// Re-run the dedupe check at commit time: rows may have been added between …
for (const row of rows) {
  if (row.status !== "new") continue;   // user-overridden duplicates pass through
  if (existingKeys.has(key)) row.status = "duplicate";
}
```

Note the deliberate escape hatch: a row the user explicitly overrode is not
re-checked, so a legitimate same-amount-same-day repeat charge can be forced
through.

### Wealth

| Route | Methods | Lines | Behavior |
|---|---|---|---|
| `/api/investments` | GET, POST, PATCH, DELETE | **787** | Six resources in one route |
| `/api/market-prices` | GET, POST | 121 | Quotes with `market_price_history` caching |
| `/api/liabilities` | GET, POST | 78 | |
| `/api/liabilities/[id]` | PATCH, DELETE | 86 | |
| `/api/liabilities/[id]/payments` | POST, DELETE | 88 | |
| `/api/loans` | GET, POST | 170 | POST optionally dual-writes the outgoing expense |
| `/api/loans/[id]` | PATCH, DELETE | 115 | `?delete_expense=1` also removes the linked movement |
| `/api/loans/[id]/repayments` | POST, DELETE | 195 | Syncs the linked income entry and loan status |

`/api/investments` dispatches on a `resource` discriminator using Zod
discriminated unions:

```ts
const createMutationSchema = z.discriminatedUnion("resource", [
  { resource: z.literal("brokerageAccount"), … },
  { resource: z.literal("trade"),            … },
  { resource: z.literal("cashMovement"),     … },
  { resource: z.literal("watchlist"),        … },
  { resource: z.literal("savingsAccount"),   … },
  { resource: z.literal("savingsTransfer"),  … },
]);
```

with parallel `switch (parsed.data.resource)` blocks for create, update, and
delete. The union gives full type narrowing per branch, so the pattern is type-safe
— but at 787 lines it is the codebase's clearest decomposition candidate.

### Infrastructure

| Route | Methods | Behavior |
|---|---|---|
| `/api/exchange-rates` | GET | EUR-base rates from Frankfurter/ECB, fallback to open-er-api, with per-currency source provenance (`ecb` \| `open-er-api` \| `manual` \| `fallback`) |
| `/api/admin/deduplicate` | POST | Maintenance: removes duplicate imported rows using the canonical 5-field key, paginated at 1,000 rows |
| `/auth/callback` | GET | Exchanges the email-confirmation code for a session, forwards to `?next=` (`/onboarding` for new signups) |

---

## 4.3 Validation

Zod schemas live in [`src/lib/validations.ts`](../src/lib/validations.ts) and are
**shared between React Hook Form and the API routes**. The same
`expenseSchema` that validates the capture sheet validates
`POST /api/expenses`. A field constraint therefore cannot drift between client and
server.

Query-parameter schemas are declared inline per route with coercion:

```ts
const expenseQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(255).optional(),
});
```

Note the bounded ranges — `year` is capped at 2020–2100, `search` at 255 chars.
These are cheap guards against malformed or abusive queries reaching Postgres.

---

## 4.4 The two data paths

Not every read goes through `/api`. The codebase deliberately runs **two access
paths**, and knowing which applies is essential.

| Path | Used for | Auth | RLS |
|---|---|---|---|
| **Route handlers** (`/api/*`) | Expenses, incomes, summary, imports, investments, loans, liabilities, insights | Bearer → service-role | **Bypassed**; explicit `user_id` filter |
| **Browser Supabase client** | Categories, budgets, custom budgets, monthly plans, profile settings, auth | User session | **Enforced** |

The split is historical: expense and income data used to live in a second Supabase
project reachable only with a service-role key, so it needed a server hop.
Everything else stayed on the client. After consolidation the split was never
unwound.

The practical consequences:

- A budget write is a direct `supabase.from("custom_budgets").insert(...)` from the
  browser, protected by RLS.
- An expense write is `POST /api/expenses`, protected by an explicit filter.
- Two different failure modes, two different debugging paths, and two places to
  audit when reasoning about authorization.

This is the most significant structural inconsistency in the system. It is not
broken — both paths are secure — but it is an accident of history rather than a
design, and it is documented as such in
[10 — Architectural Decisions](10-architectural-decisions.md#ad-1-the-ledger-bridge-and-its-ghost).

---

## 4.5 Degradation strategy

Because migrations are applied manually and independently of deploys, routes are
written to tolerate a schema that lags the code.
[`lib/supabase/postgrest-errors.ts`](../src/lib/supabase/postgrest-errors.ts)
provides `isMissingTableError`, `logSuppressedSupabaseError`, and
`resolveOptionalTableResult`. Examples in the wild:

- `proposeImport` degrades to uncategorized proposals when `categorization_rules`
  is missing, rather than failing the upload:

  ```ts
  // categorization_rules may not exist yet (migration pending) — degrade to
  // uncategorized proposals rather than failing the upload.
  const rules = rulesResult.error ? [] : (rulesResult.data ?? []);
  ```

- `CurrencyProvider` swallows errors reading `manual_fx_rates`.
- `/api/insights/household` falls back from RPCs to paginated row scans.
- `/api/dashboard/summary` treats a missing `balance_checkpoints` table as
  "untracked" rather than an error.

This is a coherent, deliberate resilience strategy that follows directly from the
deployment model.

---

[← Data Model](03-data-model.md) · [Index](README.md) · [Next: Frontend Architecture →](05-frontend-architecture.md)
