# 08 — Cross-Cutting Concerns

[← Import Pipeline](07-import-pipeline.md) · [Index](README.md) · [Next: Operations →](09-operations.md)

---

## 8.1 Authentication and authorization

### The chain

```
Signup ──▶ Supabase Auth (email + password, confirmation required)
   │         └─ emailRedirectTo = NEXT_PUBLIC_SITE_URL + /auth/callback?next=/onboarding
   │
   ├─▶ handle_new_user trigger fires on auth.users → creates profiles row
   │
   ├─▶ /auth/callback exchanges the code for a session
   │
   └─▶ proxy.ts on every subsequent request
         └─ updateSession() refreshes cookies, enforces redirects
```

### Four client types, four trust levels

| Client | Module | Auth basis | RLS |
|---|---|---|---|
| Browser | `supabase/client.ts` | Session cookie | Enforced |
| Server (RSC/handler) | `supabase/server.ts` | Session cookie via `cookies()` | Enforced |
| Bearer | `supabase/request.ts` | `Authorization` header, verified | Enforced |
| **Service role** | `supabase/service-role.ts` | Service key | **Bypassed** |

`service-role.ts` is guarded with `import "server-only"`, so an accidental client
import is a build error rather than a key leak.

### The ledger-context pattern

Every data-bearing API route resolves an "effective user" before querying:

```ts
const { supabase: appSupabase, user } = await createRequestClient(request);
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const ledgerSupabase = createServiceRoleClient();
const ledgerUser = ledgerSupabase
  ? await resolveServiceRoleUserByEmail(user.email)
  : null;

const supabase = ledgerSupabase ?? appSupabase;
const effectiveUserId = ledgerUser?.id ?? user.id;
```

**This exists for a historical reason.** The app once spanned two Supabase
projects: an auth project and a separate "ledger" project holding imported bank
data. The same human had two different user IDs, so the bridge resolved them
*by email*. The ledger project was deleted in July 2026 after a free-tier pause and
everything was consolidated — but the pattern remains in every route, now
resolving a user to themselves in the same project.

It is factored into `lib/supabase/ledger.ts` (`resolveLedgerContext`) and
`lib/loans/ledger.ts` (`resolveLedgerWriteClient`), though several routes still
inline it.

**Authorization is therefore an explicit `.eq("user_id", effectiveUserId)` on
every query.** Omitting it in a new route would expose other users' data despite
RLS being enabled, because the service-role client ignores RLS. This is the single
most important rule for anyone adding a route.

### Redirect rules

| Condition | Result |
|---|---|
| No user, path not `/login`, `/signup`, `/auth`, `/api` | → `/login` |
| User on `/login` or `/signup`, new account, unsettled | → `/onboarding` |
| User on `/login` or `/signup`, otherwise | → `/home` |
| Supabase env missing | Pass through unauthenticated (fail-open) |

`/api` is excluded from the redirect so API calls return `401` JSON rather than an
HTML login page — correct for a fetch client.

---

## 8.2 Internationalization

Two locales, EN and ES, implemented without an i18n library.

### The mechanism

```ts
const { t, tc, locale, intlLocale } = useLocale();

t("Home", "Inicio")                  // inline pair, no message key
tc("Tithe / Diezmo")                 // category name through the alias index
```

Every user-facing string is written twice, at the call site. There is no catalog,
no key namespace, and no extraction step. Translations cannot drift from their
usage because they are physically adjacent to it.

### Preference resolution

```
1. Explicit user choice          localStorage "be-locale-explicit" = "1"
                                 + "be-locale" + cookie "be_locale"
2. Device primary language       navigator.languages[0]
3. Server Accept-Language        highest-q tag, first paint only
```

Mapping is deliberately coarse: a tag starting with `es` → Spanish; **everything
else**, including French or German, → English.

The subtlety worth preserving: **the device default is never persisted**. Only an
explicit choice writes storage. A user whose phone is Spanish sees Spanish; if they
change their phone to English, the app follows, because nothing was pinned. Once
they choose in Settings, that wins forever.

Server-side, the root layout reads `Accept-Language` to set `<html lang>` correctly
on first paint — avoiding a flash of the wrong language and keeping screen readers
and SEO correct.

### Category names

Stored in English, translated at render. The index in `lib/constants.ts` is keyed
on an accent-stripped, lowercased name and supports aliases, so `"Tithe"`,
`"Diezmo"`, and `"Tithe / Diezmo"` all resolve to one entry. This matters because
the import pipeline creates `"Tithe / Diezmo"` while onboarding creates `"Tithe"`.

### Placement rule

Language controls **never** appear in `Screen` headers — a grep gate enforces it.
They live in the mobile profile sheet, the Settings list, and a compact chip on
desktop/auth. The reason is practical: headers already carry month pickers and
actions, and a language switcher crowded them.

Layouts must tolerate ±35% text-length variance between the two languages.

---

## 8.3 Multi-currency

20 supported currencies; EUR is the default base.

### The invariant

**Amounts are stored in their original currency and converted only for display.**
A €50 expense and a 200,000 COP expense both persist with their own `currency`
value. Nothing is rewritten when the base currency changes.

```
profiles.base_currency ──┐
                          ├─▶ CurrencyProvider.convert(amount, fromCurrency)
GET /api/exchange-rates ──┤        └─▶ <AmountText> ──▶ every rendered amount
profiles.manual_fx_rates ─┘
```

### Rate sourcing

`/api/exchange-rates` returns EUR-base rates plus **per-currency provenance**:

| Source | Meaning |
|---|---|
| `ecb` | Frankfurter / European Central Bank — the trusted default |
| `open-er-api` | Fallback provider |
| `manual` | User override from `profiles.manual_fx_rates` |
| `fallback` | Static last resort |

The UI badges anything that is not `ecb`, so a user always knows when a number
rests on a manual or degraded rate. Manual rates are merged **over** live rates:

```ts
const effectiveRates = useMemo(() => ({ ...rates, ...manualRates }), [rates, manualRates]);
```

Conversion is cross-rate through the EUR base:

```ts
if (fromCurrency === baseCurrency) return amount;
const fromRate = effectiveRates[fromCurrency];
const toRate = effectiveRates[baseCurrency];
if (!fromRate || !toRate) return amount;      // fail safe: return unconverted
return (amount / fromRate) * toRate;
```

When rates are unavailable the function returns the original amount rather than
zero or `NaN` — a number that is wrong in magnitude is far better than a blank or a
crash on a financial screen.

### Display rules

- Income renders `positive` tone with a `+`; expenses render negative.
- When stored currency differs from base, ledger rows show the original alongside
  the converted value (`AmountText showOriginal`).
- All numerals use Geist Mono with `tabular-nums` so columns align.
- `Intl.NumberFormat` instances are cached in a `Map` keyed `locale:currency`.

### Input parsing

`parseLocalizedCurrencyInput` accepts both EN and ES conventions — `1,234.56` and
`1.234,56` — trying the locale-primary convention first and the alternate second.
This matters for pasted data, which frequently arrives in the other convention.

---

## 8.4 State management and caching

Three tiers, each with a clear job.

| Tier | Technology | Holds |
|---|---|---|
| Server state | TanStack Query | Everything fetched from `/api` or Supabase |
| Global UI state | React Context (5 providers) | Month, currency, locale, theme |
| Local state | `useState` | Form fields, sheet open/closed |

There is **no Redux/Zustand/Jotai**, and no need for one.

### Cache policy

```ts
{ staleTime: 60_000, gcTime: 600_000, retry: 1, refetchOnWindowFocus: false }
```

The 60-second `staleTime` makes month navigation instant. `refetchOnWindowFocus:
false` is deliberate — a finance app that refetches every time you alt-tab is
distracting, and mutations already invalidate explicitly.

The comment on `makeQueryClient` records a reversal worth knowing: HTTP caching on
transactional GETs was **removed** in favor of the client cache, because
browser-cached responses were defeating invalidation after mutations.

### Key design

Keys are hierarchical so prefix invalidation works:

```ts
expenses: (f) => ["expenses", f.year, f.month, f.categoryId ?? null, f.search ?? null]
expensesAll: ["expenses"]
```

`useCapture` invalidates `expensesAll` + `monthlySummaryAll`, and every month,
category, and search variant refetches correctly. Optimistic updates target the
narrower `["expenses", year, month]` prefix via `setQueriesData`.

### Optimistic update pattern

```ts
onMutate:   cancelQueries → insert optimistic row (id: `optimistic-${Date.now()}`)
onError:    invalidate the month key → toast → SHEET STAYS OPEN
onSuccess:  invalidate domains → success toast with Undo → envelope alerts
```

The "sheet stays open on error" rule is explicit product guidance in `docs/APP.md`:
*never dismiss the sheet until the save succeeds*. Closing a form on failure loses
the user's typing.

---

## 8.5 Error handling

| Layer | Strategy |
|---|---|
| Proxy | `try/catch` → pass through unauthenticated (fail open) |
| API routes | Log real error server-side, return generic message + status |
| `authorizedFetch` | Throw on non-2xx so React Query surfaces it |
| Hooks | `onError` → Sonner toast, revert optimistic state |
| Providers | Swallow-and-degrade (missing columns, blocked storage, absent rates) |
| Domain | Guard divide-by-zero, `Number.isFinite` checks, safe fallbacks |
| Database | CHECK constraints + triggers as the last line |

The consistent principle is **degrade rather than fail**. A missing migration, a
blocked `sessionStorage`, an unreachable FX API, or an absent RPC each produce a
reduced experience rather than an error screen. For a personal finance tool used
daily on a phone, availability of *most* of the app beats correctness-or-nothing.

The one place this principle is deliberately inverted is the balance checkpoint,
where a table-level CHECK constraint and a trigger *reject* inconsistent data
outright. Financial reconciliation is the one thing that must not silently degrade.

---

## 8.6 Progressive Web App

| Aspect | Implementation |
|---|---|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` |
| Icons | 192px and 512px PWA icons, 512px browser icon, 180px Apple touch, multi-size favicon |
| Theme color | Matched pair `#f4f6f8` / `#070809` in both viewport and manifest |
| Viewport | `viewportFit: "cover"` for notched devices |
| Apple | `appleWebApp: { capable: true, statusBarStyle: "default" }` |
| Deep links | 8 permanent redirect stubs protect installed shortcuts |

`design.md` §2.6 pins the brand mark precisely — a condensed forward-leaning warm
white **B** with an emerald ledger slash (`#18b986`) on a near-black rounded
superellipse — and requires every icon surface to be regenerated from the same
1024×1024 master so tab, home screen, and app chrome never disagree.

There is **no service worker**, so the app is installable but not offline-capable.
Given that every screen needs live data, this is a defensible scope decision.

---

[← Import Pipeline](07-import-pipeline.md) · [Index](README.md) · [Next: Operations →](09-operations.md)
