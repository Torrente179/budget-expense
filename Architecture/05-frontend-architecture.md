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
│   ├── wealth/        page.tsx · investments/ · savings/ · liabilities/ · loans/
│   ├── insights/      page.tsx · calendar/ · categories/[id]/
│   ├── review/ · import/ · wisdom/ · settings/ · onboarding/
│   └── ── permanent redirect stubs ──
│       dashboard/ → /home          expenses/  → /movements
│       budgets/   → /budget        incomes/   → /movements?tab=income
│       analytics/ → /insights      calendar/  → /insights/calendar
│       investments/ → /wealth      movimientos/ → /movements
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
│  reads headers().get("accept-language") → initialLocale
│  <html lang={initialLocale} suppressHydrationWarning>
│
├─ ThemeProvider              next-themes, class strategy, defaultTheme="light"
   └─ LocaleProvider          initialLocale from Accept-Language
      └─ TooltipProvider
         └─ {children} + <Toaster />

app/(app)/layout.tsx  ("use client")
└─ QueryProvider              shared QueryClient (browser singleton)
   └─ CurrencyProvider        base currency + FX rates + convert()
      └─ MonthProvider        globally selected month  ← needs QueryClient
         └─ OnboardingGate    soft new-user redirect
            └─ Sidebar | Topbar | <main> | TabBar | CaptureFab
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
| `ThemeProvider` | light/dark/system | localStorage (next-themes) |
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

1. Explicit user choice (`be-locale-explicit` flag in localStorage) — wins forever
2. Device / browser primary language (`navigator.languages[0]`)
3. Server `Accept-Language` hint (first paint only)

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
├── charts/     2  chart-theme (shared Recharts config) + chart-card
│
└── feature/   64  capture · home · budget · budgets · movements · wealth
                   insights · onboarding · review · import · settings
                   auth · shared (incl. empty-state) · wisdom · layout
```

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

**`Screen`** — the app-screen scaffold: sticky translucent header, avatar on root
screens or a back chevron on pushed screens, actions slot, subheader row. Its back
behavior is specified precisely:

> When `backHref` is set, Back calls `router.back()` if history exists; else
> navigates to `backHref` (deep-link/refresh fallback). Never hard-code `/home` as
> the only back target.

That rule exists because a hard-coded `/home` back link strands users who arrived
by deep link or refreshed mid-flow.

### Chrome

| Component | Surface | Notes |
|---|---|---|
| `Sidebar` | Desktop | Primary nav + secondary footer group + review badge |
| `Topbar` | Desktop only | Month picker, currency switch, ⌘K, profile |
| `TabBar` | Mobile | 5 primary sections, safe-area padding |
| `ProfileSheet` | Mobile | Secondary nav + **language row** + logout |
| `CommandMenu` | Both | ⌘K palette over all destinations (cmdk) |
| `CaptureFab` | Both | Floating add button, thumb zone |

All five consume `lib/navigation.ts`. All are hidden on `/onboarding` by the
`isOnboarding` check in the app layout.

---

## 5.4 The design token system

[`src/app/globals.css`](../src/app/globals.css) (250 lines) defines roughly **120
custom properties**, split into raw values on `:root` / `.dark` and Tailwind
exposure through `@theme inline`. Both themes must define every token.

### Color

| Group | Tokens |
|---|---|
| Surfaces | `background`, `card`, `popover`, `secondary`, `muted`, `accent`, `border`, `input`, `ring` |
| Sidebar | `sidebar`, `sidebar-accent`, `sidebar-border`, `sidebar-primary`, `sidebar-ring` (+ foregrounds) |
| Semantic status | `success`, `warning`, `danger`, `info` — each with `-foreground` and `-subtle` |
| Cashflow | `income`, `available`, `expense` — Home stats; `positive`/`negative` alias income/expense |
| Charts | `chart-1..5`, `chart-grid`, `chart-axis` |

Budget **usage-band** hexes (safe → critical) and category default map live in
[`src/lib/palette.ts`](../src/lib/palette.ts) with `ACTIVE_PALETTE` (`"v2"` |
`"og"`) for a controlled revert. Cashflow CSS vars in `globals.css` must stay
mirrored when flipping.

Home composition (desktop): movements column left; budgets + spending donut
stacked in the right `lg:col-span-2` column. Budget rings:
`src/components/home/budget-pace-chart.tsx`.

### Typography

Geist for UI, Geist Mono for **all numerals**, always `tabular-nums`.

| Token | Size | Use |
|---|---|---|
| `text-display` | 2.25rem | Hero numerals (net worth, safe-to-spend) |
| `text-title` | 1.375rem | Screen titles |
| `text-heading` | 1.0625rem | Card/section titles |
| `text-body` | 0.875rem | Default |
| `text-caption` | 0.75rem | Secondary |
| `text-label` | 0.6875rem | Micro labels |
| `label-caps` | utility | The eyebrow: uppercase, 0.12em tracking, muted |

Arbitrary `text-[…rem]` and `tracking-[…]` are banned outside `components/ui/`.

### Elevation, radius, motion

Three theme-aware shadows (`--elevation-1/2/3`): resting cards · raised
(popovers, sticky headers) · modal/sheet/FAB. Radius derives from `--radius: 1rem`
with a documented scale; `rounded-full` is reserved for round icon buttons and
dots — never status pills or tabs.

Motion: route transitions are **opacity-only** (transforms break sticky headers),
160ms ease-out; entrances ≤240ms; `prefers-reduced-motion` collapses everything.

---

## 5.5 Mobile-first strategy

Below `md` the app behaves like a native application rather than a narrowed
desktop site.

| Concern | Mobile (`< md`) | Desktop |
|---|---|---|
| Chrome | No topbar; each screen renders its own sticky translucent header | Sidebar + topbar |
| Navigation | Bottom `TabBar`, 5 tabs | Sidebar |
| Secondary nav | Profile sheet | Sidebar footer |
| Forms | Bottom sheets, drag handle, sticky submit | Side sheets / dialogs |
| Lists | Full-bleed rows, min-h-16, ≥44px targets, swipe-to-delete + undo | Rows in a Card, delete on hover |
| Stat rows | Horizontal scroll with snap | Grid |
| Capture | FAB in the thumb zone | FAB + sheet |
| Language | Profile sheet row | Compact chip |

Viewport is `viewportFit: "cover"` with `theme-color` matched to the real
background pair (`#f4f6f8` light / `#070809` dark) in both the viewport export and
`manifest.ts`. Main content padding clears the tab bar plus
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
- **Error** — toast via Sonner; destructive operations offer Undo.

The Undo pattern is used consistently for deletes: the row disappears optimistically
and a 5-second toast offers reversal, which issues the compensating request.

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
