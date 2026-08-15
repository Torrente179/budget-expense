# 05 — Frontend Architecture

[← API Surface](04-api-surface.md) · [Index](README.md) · [Next: Domain Logic →](06-domain-logic.md)

---

## 5.1 App Router structure

```
src/app/
├── layout.tsx                 Root (Server Component)
├── page.tsx                   → redirect /home
├── globals.css                Design tokens
├── manifest.ts                PWA manifest → /manifest.webmanifest
├── icon.png · apple-icon.png · favicon.ico
│
├── (auth)/                    Unauthenticated shell
│   ├── layout.tsx
│   ├── login/page.tsx · signup/page.tsx
│   └── auth/callback/route.ts Email-confirmation exchange
│
├── (app)/                     Authenticated shell
│   ├── layout.tsx             Providers + chrome
│   ├── home/          page.tsx · loading.tsx
│   ├── movements/     page.tsx · loading.tsx · recurring/page.tsx
│   ├── budget/        page.tsx
│   ├── wealth/        page.tsx · accounts/ · investments/ · savings/ · liabilities/ · loans/
│   ├── insights/      page.tsx · calendar/ · categories/[id]/
│   ├── review/ · import/ · wisdom/ · settings/ · onboarding/
│   └── ── permanent redirect stubs ──
│       dashboard/ → /home          expenses/  → /movements
│       budgets/   → /budget        incomes/   → /movements?tab=income
│       analytics/ → /insights      calendar/  → /insights/calendar
│       investments/ → /wealth      movimientos/ → /movements
│
├── __design/up/               Flag-gated, noindex deterministic UI review
│
└── api/                       27 route handlers
```

**Route groups** `(auth)` and `(app)` add no URL segment; they exist solely to give
the two shells different layouts and provider trees.

**Redirect stubs are permanent infrastructure.** Eight legacy routes are
six-line files calling `redirect()`. `design.md` states the rule explicitly:
*never delete them; installed PWAs may deep-link to them*. A user who added
`/dashboard` to their home screen in April must still land somewhere sensible.

**Pages are deliberately thin.** Most are 6–10 lines. `home/page.tsx` is seven
lines that render `<HomeScreen />`. All logic lives in
`src/components/<section>/`. The exceptions — `settings` (325), `insights/categories/[id]`
(303), `wealth/investments` (452), `wealth/savings` (181), `import` (142) — are
screens that were never extracted into components, an inconsistency worth
normalizing.

---

## 5.2 The provider tree

Two nested layouts establish five contexts in a specific order.

```
app/layout.tsx  (Server Component)
│  reads explicit be_locale cookie, else Accept-Language → initialLocale
│  <html lang={initialLocale}>
│
└─ LocaleProvider             server-resolved initialLocale
   └─ {children} + <Toaster />

app/(app)/layout.tsx  ("use client")
└─ QueryProvider              shared QueryClient (browser singleton)
   └─ CurrencyProvider        base currency + FX rates + convert()
      └─ MonthProvider        globally selected month  ← needs QueryClient
         └─ ProfileSheetProvider
            └─ OnboardingGate soft new-user redirect
               └─ Sidebar | <main> | TabBar | CaptureFab
```

The ordering is load-bearing in two places:

1. **`MonthProvider` must be inside `QueryProvider`** — it calls `useQueryClient()`
   to invalidate expenses and summary after a month-change recurring sync.
2. **`LocaleProvider` must be in the root layout, not the app layout** — the auth
   pages need bilingual copy too, and `<html lang>` must be correct on first paint
   for SEO and screen readers.

### Provider responsibilities

| Provider | State | Persistence |
|---|---|---|
| `LocaleProvider` | `en` \| `es`, `t()`, `tc()` | localStorage + cookie, **only when explicit** |
| `CurrencyProvider` | base currency, rates, sources, `convert()` | `profiles.base_currency` + `manual_fx_rates` |
| `MonthProvider` | `{ month, year, isCurrentMonth }` | In-memory only |
| `QueryProvider` | React Query cache | In-memory |

**`MonthProvider` is the reason month selection feels right.** Because the
selected month is global, navigating Home → Movements → Insights keeps March
selected. A local `useState` per screen would silently reset it. It also fires a
once-per-month-key recurring sync, guarded by a ref so re-renders do not re-trigger:

```ts
const key = `${year}-${month}`;
if (syncedKeyRef.current === key) return;
syncedKeyRef.current = key;
void syncRecurringMonth(month, year).then(() => { /* invalidate */ });
```

**`LocaleProvider` implements a three-tier preference** with a subtle rule:

1. Explicit user choice (`be-locale-explicit` plus `be_locale`) — wins forever
2. Server request's primary `Accept-Language` value — correct first-paint `<html lang>`
3. Device / browser primary language (`navigator.languages[0]`) during hydration

The soft device default is **never written to storage**. Only an explicit choice
persists. A Spanish-phone user who has not chosen sees Spanish; if they later
switch their phone to English, the app follows — because nothing was pinned.

---

## 5.3 Component taxonomy

98 components in four tiers. The hierarchy is prescriptive: reach for the highest
tier that fits before writing new markup.

```
components/
├── ui/        23  Primitives — shadcn over Base UI
│                  card, button, dialog, sheet, select, popover, command,
│                  dropdown-menu, calendar, table, tabs*, input-group, …
│                  * tabs.tsx is RETIRED: zero consumers, superseded by
│                    patterns/underline-tabs
│
├── patterns/   9  THE composed vocabulary — most important tier
│                  screen · amount-text · transaction-row · stat-card
│                  progress-meter · status-tag · underline-tabs
│                  breakdown-donut · section-header
│
├── charts/     2  chart-theme (shared Recharts config, SPEND_CHART_COLOR) +
│                  chart-card
│
└── feature/   64  capture · home · budget · budgets · movements · wealth
                   insights · onboarding · review · import · settings
                   auth · shared (incl. empty-state) · wisdom · layout
```

**Insights spend charts** (`insights-trend-charts.tsx`, deferred near-viewport
load): daily bars from `summary.dailySpending` (current month truncated to
today); 12-month bars from household aggregates. Clicks use Recharts
`activeIndex` to resolve the datum — day → `/insights/calendar?day=N`, month →
`MonthProvider.setMonthYear` + `/movements?tab=expenses`. Category spend bars
live only in `monthly-report.tsx`, not a second Insights list.

### The patterns tier

These ten components encode the product's visual and behavioral rules. Four are
described by `design.md` as the *only* sanctioned way to do their job:

**`AmountText`** — THE money renderer. Converts through `CurrencyProvider`,
renders tabular mono numerals, applies tone (positive/negative) and sign, and with
`showOriginal` displays the original currency beside the converted base amount.
*Never render a bare stored number.*

**`StatusTag`** — a tone dot plus a label in ink. The only way to show state
(Buy/Sell, Deposit/Withdrawal, Over-budget). Uppercase tinted pills are banned.

**`UnderlineTabs`** — the only in-screen view switcher, app-wide: Wealth sub-nav,
Movements filters, Wisdom sections, Import review filters. `ui/tabs.tsx` (filled
pill chips) is retired with zero consumers.

**`Screen`** — the app-screen scaffold: solid header, avatar on root screens or a
back chevron on pushed screens, actions/subheader slots, and desktop command,
language, and currency utilities. Its three presentation modes are
`chrome-sheet` (ink hero into white sheet), `dark-canvas` (Trackers/Savers), and
`plain` (dense secondary screens). Its back behavior is specified precisely:

> When `backHref` is set, Back calls `router.back()` if history exists; else
> navigates to `backHref` (deep-link/refresh fallback). Never hard-code `/home` as
> the only back target.

That rule exists because a hard-coded `/home` back link strands users who arrived
by deep link or refreshed mid-flow.

### Chrome

| Component | Surface | Notes |
|---|---|---|
| `Sidebar` | Desktop | Flat ink primary nav + secondary footer group + review badge |
| `Screen` header | Desktop | Solid route header with actions, currency, language, and ⌘K |
| `TabBar` | Mobile | Flat opaque 60px ink capsule, 5 primary sections, safe-area padding |
| `ProfileSheet` | Mobile | Secondary nav + **language row** + logout |
| `CommandMenu` | Both | ⌘K palette over all destinations (cmdk) |
| `CaptureFab` | Both | Floating add button, thumb zone |

Navigation surfaces consume `lib/navigation.ts`. Global chrome is hidden on `/onboarding` by the
`isOnboarding` check in the app layout.

---

## 5.4 The design token system

[`src/app/globals.css`](../src/app/globals.css) defines one appearance through
raw values on `:root` and Tailwind exposure through `@theme inline`. The surface
contract is ink chrome (`#1A1B23`), raised ink, coral (`#FF7A64`), restrained
lemon/mint, and opaque white or subtly striped rows. The declared `dark` variant
exists only for legacy compilation; no provider sets it.

### Color

| Group | Tokens |
|---|---|
| Surfaces | `background`, `card`, `popover`, `secondary`, `muted`, `accent`, `border`, `input`, `ring` |
| Sidebar | `sidebar`, `sidebar-accent`, `sidebar-border`, `sidebar-primary`, `sidebar-ring` (+ foregrounds) |
| Semantic status | `success`, `warning`, `danger`, `info` — each with `-foreground` and `-subtle` |
| Cashflow | `income`, `available`, `expense` — Home stats; `positive`/`negative` alias income/expense |
| Charts | `chart-1..5`, `chart-grid`, `chart-axis`; Insights spend bars also use `SPEND_CHART_COLOR` (`#EC4899`) from `chart-theme.tsx` |

Budget **usage-band** hexes (safe → critical) and category default map live in
[`src/lib/palette.ts`](../src/lib/palette.ts) with `ACTIVE_PALETTE` (`"v2"` |
`"og"`) for a controlled revert. Cashflow CSS vars in `globals.css` must stay
mirrored when flipping.

Home composition: centered checkpoint-backed available balance plus compact
income/spent/daily-guide/pace context; remaining-first Trackers; a stacked
spending strip with ranked categories; and Upcoming + recent movements in one
continuous white sheet. Desktop places amount/activity left and Trackers/
analysis right. Home shows **`spending_limit` only**; Savers never appear there.
The two-layer number contract is
documented in [`docs/balance-carryover.md`](../docs/balance-carryover.md).

Budget screen: `dark-canvas` with explicit **Trackers** and **Savers** views.
Tracker cards are remaining-first and red only when exceeded; Saver cards show
contributed/target progress and positive completion. Existing plan,
recommendation, setup and CRUD controllers are unchanged.

**Shared UP presentation seam** — controller-heavy core screens map their
existing hooks/calculations into typed production view components. Home,
Movements, Recurring, Budget cards, and Capture chrome are therefore reused by
the private fixture harness without duplicating UI or reaching Supabase.

**Patrimonio** (`/wealth`) — the balance sheet. `wealth-overview.tsx` is
orchestration only: it calls `useNetWorth()` (the single composition root over
`useInvestments` + `useHouseholdInsights` + `useWealthAccounts` + loans +
snapshots) and passes plain props to every card. Because the cards take props
rather than calling hooks, they can be rendered from fixtures in a preview
harness without network access — which is how this section is visually verified,
since there is no local auth session.

The old five-item `WealthNav` underline sub-nav is **deleted**. Patrimonio is a
hub with pushed category pages (`Patrimonio → category → item`), so sub-pages
render a `WealthBreadcrumb` plus `Screen`'s back chevron. In-screen tabs on the
overview (Resumen · Activos · Deudas) are client state, not routes.

Net-worth math lives in `src/lib/wealth/net-worth.ts` — pure, currency-agnostic,
and unit-tested (`npm run test:wealth`). No screen re-derives a total.

**Create / edit** — `src/components/budgets/budget-wizard.tsx` (`BudgetWizard`),
a centered `Dialog` on desktop and a bottom `Sheet` under 768px, replacing the
old single-step side sheet (`custom-budget-form.tsx`, deleted 2026-07-25).
Three steps (Tipo → Configuración → Revisar); edit enters at step 2 as a 2-step
flow with the kind locked, since changing engine mid-month would reclassify
history. Form state lives above the step switch so Back never remounts.
The step-2 preview matches the chosen categories against the month's expenses
**before** saving, so a limit created over existing spend never jumps from 0%
after the write.

All Tracker presentation now follows the same rule: coral while under the
ceiling and danger red only after `progressAmount > target`. Savers use positive
progress and completion semantics; 100% is success for a Saver, not a Tracker.

### Typography

Inter is the documented stand-in for the unconfirmed UP typeface. UI and money
figures share it; numerals always use `tabular-nums`.

| Token | Size | Use |
|---|---|---|
| `text-display` | 2.625rem | 42px mobile money hero |
| `text-title` | 1.375rem | Screen titles |
| `text-heading` | 1.0625rem | Card/section titles |
| `text-body` | 0.9375rem | Default / compact row |
| `text-caption` | 0.75rem | Secondary |
| `text-label` | 0.6875rem | Micro labels |
| `label-caps` | utility | The eyebrow: uppercase, 0.12em tracking, muted |

Arbitrary `text-[…rem]` and `tracking-[…]` are banned outside `components/ui/`.

### Elevation, radius, motion

UP surfaces are flat; ordinary cards have no drop shadow or hover lift. Radius
derives from `--radius: 0.75rem`; controls may be pills, while status semantics
remain the responsibility of `StatusTag`.

Motion: 100ms/0.98 press, 240ms ordinary state changes, 280ms sheet entry,
200ms sheet exit, 560ms one-shot success, and 30ms list stagger for only the
first six visible items. There is no whole-page swipe navigation and
`prefers-reduced-motion` collapses nonessential motion.

---

## 5.5 Mobile-first strategy

Below `md` the app behaves like a native application rather than a narrowed
desktop site.

| Concern | Mobile (`< md`) | Desktop |
|---|---|---|
| Chrome | No topbar; each screen renders its own solid mode-aware header | Flat ink sidebar + solid screen header |
| Navigation | Opaque 60px ink `TabBar`, 5 tabs | Sidebar |
| Secondary nav | Profile sheet | Sidebar footer |
| Forms | Opaque white bottom sheets, drag handle, keyboard-safe sticky submit | Side sheets / dialogs |
| Lists | Full-bleed rows, min-h-16, ≥44px targets, swipe-to-delete + undo | Rows in a Card, delete on hover |
| Stat rows | Horizontal scroll with snap | Grid |
| Capture | FAB in the thumb zone | FAB + sheet |
| Language | Profile sheet row | Compact chip |

Viewport is `viewportFit: "cover"` with the single ink theme color `#1A1B23` in
both the viewport export and `manifest.ts`. Main content padding clears the tab bar plus
`env(safe-area-inset-bottom)`.

Touch affordances include `scale(0.98)` press feedback and
`overscroll-behavior-y: contain` to prevent rubber-band scroll bleeding.

---

## 5.6 Loading, empty, and error states

`design.md` mandates that every data view ship three states, and the codebase
follows it: **no blank areas while fetching**.

- **Loading** — layout-shaped `Skeleton` components, never spinners. Route-level
  `loading.tsx` files exist for `/home` and `/movements`, the two heaviest screens.
- **Empty** — `EmptyState` with a constructive action, never a bare "No data".
- **Error** — route, root, not-found, and global error boundaries are branded;
  mutation feedback uses Sonner and destructive operations offer Undo.

The Undo pattern is used consistently for deletes: the row disappears optimistically
and a 5-second toast offers reversal, which issues the compensating request.

### Private review harness

`/__design/up` renders the same production view components with deterministic
fixtures for populated, loading, empty, error, overspent, completed-goal,
long-Spanish, large-number, negative, and multi-currency states. It uses
`StaticCurrencyProvider`, never constructs a Supabase client, and issues no API
request. The route returns 404 unless `ENABLE_UP_DESIGN_REVIEW=true`; it also
returns 404 whenever `VERCEL_ENV=production`, is unlinked, and is marked
`noindex, nofollow, noarchive`.

---

## 5.7 Performance techniques

Documented in `changes/2026-07-18-expense-path-performance.md` and visible in code:

| Technique | Where | Effect |
|---|---|---|
| Single summary fetch | `/api/dashboard/summary` | Home makes one request, not seven |
| Client-side derivation | `useMonthlySummary` `useMemo` | FX changes recompute without refetching |
| Adjacent-month prefetch | `usePrefetchMonths` (summary-only mode) | Month navigation feels instant |
| Recurring sync off read path | `POST /api/recurring/sync` | GETs no longer trigger writes |
| List virtualization | `virtualized-ledger.tsx` (TanStack Virtual) | Large months stay smooth |
| Split count endpoint | `/api/insights/review/count` | Nav badge does not fetch the full queue |
| Aggregate RPCs | `household_*` functions | Server-side aggregation instead of row scans |
| Service-role client singleton | `service-role.ts` | One client per process |
| Email→user cache | 5-minute TTL map | Avoids repeated `listUsers` scans |
| Cached `Intl` formatters | `lib/utils.ts` | Formatter construction is expensive |

The client-side derivation decision is the most interesting. Returning raw rows
and converting in a `useMemo` means the currency switcher is instantaneous — the
same fetched data re-renders in a new base currency with zero network traffic.

---

[← API Surface](04-api-surface.md) · [Index](README.md) · [Next: Domain Logic →](06-domain-logic.md)
