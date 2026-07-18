# Budget & Expense — Design System

> Single source of truth for the visual language, foundations, components, and
> interaction patterns of the Budget & Expense application. This document is
> **descriptive** — it codifies the system as implemented — and **prescriptive**
> — new work must conform to it. When code and this document disagree, the
> canonical token definitions in [`src/app/globals.css`](src/app/globals.css)
> win; update this file to match.
>
> **Superseded 2026-07-17** by the five-section IA rework. The previous version
> described the pre-rework system (10 nav items across 5 divergent menus,
> ad-hoc status colors, magic values); this version describes the strict token
> system that replaced it.

- **Product:** Budget & Expense — a bilingual (EN/ES) personal stewardship,
  budgeting, and expense-tracking app.
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-first
  config) · Base UI primitives · shadcn (`base-nova`) · Framer Motion ·
  Recharts · Supabase · Vercel.
- **Theme model:** class-based light/dark via `next-themes`, **light by
  default**, system preference enabled.

---

## 1. Information architecture

Five core sections; everything else is secondary navigation. The single source
of truth for every nav surface is
[`src/lib/navigation.ts`](src/lib/navigation.ts) (`PRIMARY_NAV` +
`SECONDARY_NAV`). No component may define its own nav list.

| Section | Route | Owns |
|---|---|---|
| **Home** | `/home` | "How am I doing right now" — stat row (Income · Spent · Current · Giving), monthly-budgets area with calendar-pace bar, category donut ("Where it went"), attention feed, recent movements, desktop-only shortcuts. Current month only, everything actionable. |
| **Movements** | `/movements` (+`/recurring`) | The unified ledger: expenses + income, search/filter tabs, swipe-delete, edit sheets, recurring management. |
| **Budget** | `/budget` | Guided 3-step setup on first run (income plan → method → objectives); then "Your plan" overview with paced remaining, an objectives list (tap to edit), and the standing Giving card. |
| **Wealth** | `/wealth` (+`/investments`, `/savings`, `/liabilities`) | Everything owned and owed: net worth, allocation, runway, FX exposure, holdings, savings, debts. If it's a balance, it lives here. |
| **Insights** | `/insights` (+`/calendar`, `/categories/[id]`) | What happened and what are the patterns: ratios, 12-month trend, pillars, category breakdown, envelope utilization, anomalies, monthly report, calendar. No data-entry CTAs. |

Secondary: `/review`, `/import`, `/wisdom`, `/settings` — reachable from the
sidebar (desktop), the profile sheet (mobile), and the command menu (⌘K).

**First-run:** `/onboarding` — skippable setup wizard (not in primary nav).
See [§8 First-run onboarding & goals](#8-first-run-onboarding--goals).

Old routes (`/dashboard`, `/movimientos`, `/budgets`, `/analytics`,
`/calendar`, `/investments/*`, `/expenses`, `/incomes`) are **permanent
redirect stubs** — never delete them; installed PWAs may deep-link to them.

**Editorial rule** (tie-breaker for where a feature lives): Home = now +
actionable · Insights = past + patterns · Wealth = balances. A metric may not
live in more than one section.

---

## 2. Foundations

All tokens live in [`src/app/globals.css`](src/app/globals.css): raw values on
`:root` (light) and `.dark`, exposed to Tailwind through `@theme inline`.
**Both themes must define every token. Never hard-code hex, shadow, radius, or
font-size values in components.** The one sanctioned exception is dynamic,
data-driven **category color** (stored per category in the DB, applied via
inline `style`, flowing through `CategoryBadge`/`CategoryIcon`).

### 2.1 Color

- **Surfaces/neutrals:** the shadcn set — `background`, `card`, `popover`,
  `secondary`, `muted`, `accent`, `border`, `input`, `ring`, plus the
  `sidebar-*` group. Near-monochrome; color is reserved for meaning.
- **Semantic status tokens**, each with `-foreground` (text on solid) and
  `-subtle` (translucent tint background):
  - `success` — positive confirmation, on-target giving, healthy budgets
  - `warning` — needs attention, approaching limits, review queue
  - `danger` — over budget, destructive intent (hue-aligned with `destructive`)
  - `info` — neutral information, upcoming bills
  - `positive` / `negative` — **amount semantics only** (income vs
    loss/over-budget); aliases of success/danger so money color can diverge
    later without a refactor.
- **Charts:** `chart-1..5` for series, `chart-grid` / `chart-axis` for
  recessive plumbing. Category charts use per-category DB hex.
- Usage: `text-success`, `bg-warning-subtle`, `ring-danger/25`, etc.

### 2.2 Typography

Geist (UI) + Geist Mono (all numerals, always `tabular-nums`). The scale is
tokenized; arbitrary `text-[…rem]` values are banned outside `components/ui/`:

| Token | Size | Use |
|---|---|---|
| `text-display` | 2.25rem | Hero numerals (safe-to-spend, net worth) |
| `text-title` | 1.375rem | Screen titles, large amounts |
| `text-heading` | 1.0625rem | Card/section titles |
| `text-body` | 0.875rem | Default body |
| `text-caption` | 0.75rem | Secondary/meta text |
| `text-label` | 0.6875rem | Micro labels |
| `label-caps` (utility) | — | The eyebrow: label size, uppercase, 0.12em tracking, muted color |

Tracking: `tracking-tight` on large numerals/titles, `tracking-widest` on
uppercase micro-badges. Arbitrary `tracking-[…]` values are banned.

### 2.3 Elevation

Three theme-aware shadows (`--elevation-1/2/3`, exposed as `shadow-1/2/3`):
**1** resting cards · **2** raised (popovers, sticky headers, hover) ·
**3** modal/sheet/FAB. One-off `shadow-[…]` values are banned.

### 2.4 Radius & spacing

Radius derives from `--radius: 1rem`: `rounded-lg` (1rem) for inputs/nav rows,
`rounded-xl` (1.4rem) for cards, `rounded-2xl`/`rounded-3xl` for
sheets/modals, `rounded-full` for round icon buttons and dots only —
**never for status pills or tab chips** (use `StatusTag` / `UnderlineTabs`).
Arbitrary `rounded-[…rem]` is banned. Spacing uses Tailwind's 4px scale;
screen gutters are
`px-4 sm:px-5 lg:px-8`, matched by `Screen`'s negative margins for full-bleed
headers and lists.

### 2.5 Motion

Route transitions are **opacity-only** (transforms break sticky headers),
160ms ease-out. Entrances ≤240ms, confident easing, no looping animation.
`prefers-reduced-motion` collapses all animation globally. Touch devices get
`scale(0.98)` press feedback and `overscroll-behavior-y: contain`.

### 2.6 Brand identity & app icon

The canonical product mark is a single condensed, forward-leaning warm-white
**B** with an emerald ledger/growth slash, set on a near-black rounded
superellipse with a restrained graphite rim. It carries the reference logo's
speed and contrast while remaining recognizable at browser-favicon size. The
slash uses the product's success green (`#18b986`); it signals positive
progress and must remain subordinate to the letter.

The mark is a flat, front-facing asset. Do not add the former serif `BE`
monogram, photographic perspective, leather texture, gold accents, finance
clip art, extra lettering, or alternate colorways. Do not stretch, crop,
re-typeset, or reconstruct the mark in component code. Use the owned assets:

| Surface | Canonical asset | Size / contents |
|---|---|---|
| In-app `SiteBrand` | `public/icons/budget-expense-app-icon.png` | 1024×1024 PNG master |
| Browser / metadata icon | `src/app/icon.png` | 512×512 PNG |
| Browser favicon | `src/app/favicon.ico` | 16, 32, 48, 64, 128, and 256px |
| Apple touch icon | `src/app/apple-icon.png` | 180×180 PNG |
| PWA install icon | `public/icons/budget-expense-icon-192.png` | 192×192 PNG |
| PWA install icon | `public/icons/budget-expense-icon-512.png` | 512×512 PNG |

All icon surfaces must be regenerated from the same master artwork so the
browser tab, installed app, home screen, and app chrome never show different
identities. Preserve the built-in outer padding and high-contrast silhouette;
at 16px the white `B` must remain the dominant readable shape.

---

## 3. Component architecture

```
src/components/
  ui/         shadcn primitives (Base UI). card.tsx is THE card:
              rounded-xl bg-card ring-1 ring-border shadow-1 — use <Card>
              unmodified, never re-style it per call site.
              sheet.tsx: side="bottom" gets a drag handle + safe-area padding.
  patterns/   Composed building blocks — reach for these before new markup:
              screen.tsx          app-screen scaffold (sticky header, back or
                                  avatar leading, actions, subheader row).
                                  When `backHref` is set, Back calls
                                  `router.back()` if history exists; else
                                  navigates to `backHref` (deep-link/refresh
                                  fallback). Never hard-code `/home` as the
                                  only back target.
              section-header.tsx  eyebrow + title + optional action
              stat-card.tsx       label / value / detail tile
              amount-text.tsx     THE way to render money (converts via the
                                  currency provider, tabular mono, tone, sign)
              transaction-row.tsx canonical ledger row
              progress-meter.tsx  budget/tithe bar, ok→warning→over tones
              status-tag.tsx      quiet status indicator (tone dot + label in
                                  ink). THE way to show state — never an
                                  uppercase tinted pill.
              underline-tabs.tsx  THE in-screen view switcher (text weight +
                                  hairline indicator). No filled pill/chip
                                  tabs; `@/components/ui/tabs` is retired.
              breakdown-donut.tsx shared thin donut with center total + legend
                                  (share % + amount); used by Home & Wealth.
  charts/     chart-theme.tsx (shared Recharts tooltip style, axis/grid
              presets, gradient def, useChartMounted, currency formatters) +
              chart-card.tsx. Every chart imports from here; inline tooltip
              styles are banned.
  capture/    The unified add/edit system: capture-sheet.tsx (Expense|Income
              segmented, create+edit modes, amount-first, as-you-type category
              suggestion) + capture-fab.tsx + hooks/use-capture.ts (optimistic
              expense add with Undo). There is exactly ONE movement form.
              After a successful expense save, envelope-limit toasts may fire
              (see §9).
  onboarding/ First-run wizard + soft client gate (`OnboardingGate` in the
              app layout). Not primary nav.
  layout/     sidebar (desktop), topbar (desktop-only), tab-bar (mobile,
              5 tabs), profile-sheet (mobile secondary nav + language row +
              logout), command-menu (⌘K), site-brand. All consume
              lib/navigation.ts. Chrome (Sidebar/Topbar/TabBar/CaptureFab)
              is hidden on `/onboarding`.
  home/ movements/ budget/ wealth/ insights/   feature modules per section
  review/ import/ settings/ auth/ shared/      kept modules
```

**Providers:** `MonthProvider` (`useMonth()`) holds the globally selected
month — screens consume it, never local month state, so the month persists
across sections. `CurrencyProvider` converts; every amount is stored with its
own currency and rendered through `AmountText`/`convert()` — never render a
bare stored number.

**State discipline:** every data view ships loading (layout-shaped
`Skeleton`, no spinners), empty (`EmptyState` with a constructive action), and
error states. No blank areas while fetching.

---

## 4. Mobile-native rules

- `< md`: no topbar. Each screen renders its own sticky translucent header via
  `patterns/screen.tsx` — avatar (profile sheet) on root screens, back chevron
  on pushed screens. Bottom `TabBar` with the 5 sections + floating capture
  FAB bottom-right (thumb zone). Main content padding clears the bar +
  `env(safe-area-inset-bottom)`.
- **Back** on pushed screens = previous page (`router.back()`), with
  `backHref` as the safe fallback when there is no history (refresh / deep
  link). Do not replace this with a hardcoded `/home` Link.
- All create/edit forms are **bottom sheets** with drag handle and sticky
  submit row (keyboard-safe). Desktop uses side sheets/dialogs.
- Lists are full-bleed edge-to-edge rows (min-h-16, ≥44px targets) with
  swipe-to-delete (+ undo toast) and pull-to-refresh; desktop wraps the same
  rows in a Card and reveals delete on hover.
- Horizontal stat rows scroll with snap on mobile, grid on desktop.
- Viewport: `viewportFit: "cover"`; theme-color matches the real background
  pair (`#f4f6f8` light / `#070809` dark) in both `viewport` and
  `manifest.ts`.

---

## 5. Language, currency & voice

- Every user-facing string ships EN + ES via `t(en, es)`; category names go
  through `tc()`. Layouts must tolerate ±35% text-length variance.
- **Default language** follows the device / browser primary language
  (`Accept-Language` on first paint, then `navigator.language`). Spanish →
  `es`; anything else (including English) → `en`. A choice in Settings or the
  language toggle is saved and wins over the device after that.
- **Language controls never live in `Screen` header chrome** (they crowd month
  pickers and actions). Placement:
  - **Mobile:** profile sheet — a Language row that toggles EN ↔ ES.
  - **Settings:** full Language preference list (radio).
  - **Desktop / auth:** compact Languages chip where appropriate.
- Amounts are stored in their original currency and converted for display;
  income renders `positive` tone with a `+` sign, expenses render negative.
- Tone: warm, plain-spoken stewardship language. Domain vocabulary:
  *stewardship, ledger, envelopes/pool, giving, tithe, wisdom*. Brand kicker:
  **"Stewardship / Mayordomía."** Numbers are always formatted, never raw.

---

## 6. Quick reference

| Need | Use |
|---|---|
| Page scaffold | `<Screen title … actions … subheader …>` |
| Pushed-screen back | `<Screen backHref="/safe-fallback">` (history first) |
| Surface / panel | `<Card>` (unmodified) |
| Section/metric label | `label-caps` |
| Big number | `font-mono text-display tabular-nums` |
| Money | `<AmountText amount currency tone signed>` |
| Ledger row | `<TransactionRow>` |
| Stat tile | `<StatCard label value detail href?>` |
| Budget/tithe progress | `<ProgressMeter ratio>` |
| Add/edit a movement | `<CaptureSheet>` (never a bespoke form) |
| First-run setup | `/onboarding` + `useOnboarding` / `OnboardingGate` |
| Goal → UI mapping | `lib/onboarding/personalize.ts` |
| Envelope limit check | `lib/budgeting/envelope-alerts.ts` + notify helper |
| Positive / negative amount | `text-positive` / `text-negative` |
| Status chip | `bg-success-subtle text-success` (or warning/danger/info) |
| Chart wrapper | `<ChartCard>` + presets from `charts/chart-theme` |
| Zero data | `<EmptyState>` with an action |
| Async result | Sonner toast (destructive ops offer Undo) |
| New string | `t("English", "Español")` |
| New nav destination | add to `lib/navigation.ts` only |
| Brand / app icon | canonical assets and rules in §2.6 |

---

## 7. Gates (enforced by grep before merging UI work)

1. No raw status colors in `src/`:
   `emerald-|rose-\d|amber-\d|red-\d|sky-\d|blue-\d|#10b981` (category-color
   plumbing exempt).
2. No magic values outside `components/ui/`: `rounded-[…rem]`, `text-[…rem]`,
   `tracking-[…]`, `shadow-[0_…]`, `bg-card/96`.
3. No stale route strings outside their redirect stubs.
4. Nav items come only from `lib/navigation.ts`.
5. No language switcher in `Screen` headers — Settings / profile sheet only.

---

## 8. First-run onboarding & goals

Skippable wizard so **new** users can set income, fixed costs, debt, and goals
without blocking the app. Full product handbook:
[`docs/APP.md`](docs/APP.md) §2. Change notes:
`changes/2026-07-18-onboarding-goals-budget-alerts.md`,
`changes/2026-07-18-fix-onboarding-skip-and-new-user-gate.md`.

### Entry & gate

| Path | Behavior |
|---|---|
| Signup success | Redirect to `/onboarding` |
| Login / signup while already authed | Middleware: only profiles created on/after `2026-07-18` with both flags null → `/onboarding`; older accounts → `/home` |
| Soft client gate | `OnboardingGate` force-redirects **only new accounts** that have not completed/skipped |
| Skip state sharing | React Query key `onboardingProfile` + sessionStorage `be-onboarding-dismissed` — Skip must not bounce back to the wizard |
| Skip | On **every** step (welcome → suggestions); sets `onboarding_skipped_at`, goes `/home` |
| Resume | Home “Finish setup” + Settings “Setup guide” when a new user skipped / never finished |
| Finish | Sets `onboarding_completed_at`, writes plan / recurring / liabilities / optional envelopes, goes `/home` |
| Pre-feature users | Never force-gated (`profiles.created_at` before `ONBOARDING_FEATURE_LAUNCH`) |

### Wizard steps

1. Welcome — purpose + Skip / Start  
2. Monthly income → current-month `monthly_budget_plans`  
3. Recurring / fixed expenses (0–N)  
4. Debt / liabilities (0–N)  
5. Goals — “want budgeting help?” + multi-select  
6. Suggestions — method + starter envelopes (when help requested)  
7. Done  

Allowed `primary_goals` values: `save_more`, `increase_wealth`,
`budget_tracking`, `decrease_expenses`, `pay_debt`, `give_generously`,
`build_emergency_fund`.

### Profile columns

Migration `supabase/migrations/2026-07-18-onboarding-goals.sql` — **applied**
on live project `awpygbfocmynxpadpsji` (2026-07-18):

- `onboarding_completed_at timestamptz null`
- `onboarding_skipped_at timestamptz null`
- `wants_budget_help boolean null`
- `primary_goals text[] not null default '{}'`

### Personalization (deterministic)

`src/lib/onboarding/personalize.ts` maps answers → method id, allocation %,
seed envelopes, Home CTAs, Attention hints. Applied at finish via
`lib/onboarding/apply.ts`. Home shortcuts and Budget empty/guided copy read
`profile.primary_goals` / `wants_budget_help`. No separate goals table in v1.

| Signal | App adjustment |
|---|---|
| `wants_budget_help` | Method % on monthly plan; seed 2–4 starter envelopes |
| `budget_tracking` | Emphasize Budget + Movements in Home shortcuts |
| `decrease_expenses` | Attention → Insights; Budget messaging |
| `save_more` / `build_emergency_fund` | Savings-oriented method; optional Savings envelope |
| `pay_debt` | Attention → Wealth/Liabilities; Wealth CTA |
| `increase_wealth` | Wealth CTA on Home |
| `give_generously` | Giving envelope / keep Giving card prominent |

---

## 9. In-app budget limit alerts

**In-app only** — no push, email, or notification service.

Thresholds match custom-budget cards: **75% warn**, **90% danger**, **100%
over**.

| Surface | Behavior |
|---|---|
| Capture success (`use-capture`) | Recompute affected envelopes for the expense month; `toast.warning` / `toast.error` with name, % used, action → `/budget` |
| Home Attention feed | Rows for envelopes ≥75% this month |
| Dedup | `sessionStorage` key `be-envelope-alert-toasts` — one toast per envelope+threshold per browser session |

Helpers: `src/lib/budgeting/envelope-alerts.ts`,
`src/lib/budgeting/notify-envelope-limits.ts`.

---

## 10. Documentation map

| Doc | Owns |
|---|---|
| [`docs/APP.md`](docs/APP.md) | Product handbook: IA, onboarding, alerts, Home/Budget, migrations, code map |
| [`design.md`](design.md) | Visual system, tokens, patterns, gates (this file) |
| [`docs/vercel-supabase-handoff.md`](docs/vercel-supabase-handoff.md) | Vercel + Supabase connection |
| [`docs/pending-migrations-runbook.md`](docs/pending-migrations-runbook.md) | Migration apply status |
| [`changes/`](changes/) | Per-change history |

---

*Maintained alongside the codebase. Update this file in the same change as any
modification to tokens (`globals.css`), patterns (`components/patterns`),
primitives (`components/ui`), layout chrome (`components/layout`), first-run
onboarding, or envelope-alert behavior. Keep [`docs/APP.md`](docs/APP.md) in
sync for product behavior.*
