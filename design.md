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
- **Theme model:** class-based light/dark via `next-themes`, **dark by
  default**, system preference enabled.

---

## 1. Information architecture

Five core sections; everything else is secondary navigation. The single source
of truth for every nav surface is
[`src/lib/navigation.ts`](src/lib/navigation.ts) (`PRIMARY_NAV` +
`SECONDARY_NAV`). No component may define its own nav list.

| Section | Route | Owns |
|---|---|---|
| **Home** | `/home` | "How am I doing right now" — safe-to-spend hero, month stat row, attention feed, recent movements, quick actions. Current month only, everything actionable. |
| **Movements** | `/movements` (+`/recurring`) | The unified ledger: expenses + income, search/filter tabs, swipe-delete, edit sheets, recurring management. |
| **Budget** | `/budget` | Giving pillar (always first), income-pool plan, custom budgets, method selector. |
| **Wealth** | `/wealth` (+`/investments`, `/savings`, `/liabilities`) | Everything owned and owed: net worth, allocation, runway, FX exposure, holdings, savings, debts. If it's a balance, it lives here. |
| **Insights** | `/insights` (+`/calendar`, `/categories/[id]`) | What happened and what are the patterns: ratios, 12-month trend, pillars, category breakdown, envelope utilization, anomalies, monthly report, calendar. No data-entry CTAs. |

Secondary: `/review`, `/import`, `/wisdom`, `/settings` — reachable from the
sidebar (desktop), the profile sheet (mobile), and the command menu (⌘K).

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
sheets/modals, `rounded-full` for chips and pills. Arbitrary `rounded-[…rem]`
is banned. Spacing uses Tailwind's 4px scale; screen gutters are
`px-4 sm:px-5 lg:px-8`, matched by `Screen`'s negative margins for full-bleed
headers and lists.

### 2.5 Motion

Route transitions are **opacity-only** (transforms break sticky headers),
160ms ease-out. Entrances ≤240ms, confident easing, no looping animation.
`prefers-reduced-motion` collapses all animation globally. Touch devices get
`scale(0.98)` press feedback and `overscroll-behavior-y: contain`.

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
                                  avatar leading, actions, subheader row)
              section-header.tsx  eyebrow + title + optional action
              stat-card.tsx       label / value / detail tile
              amount-text.tsx     THE way to render money (converts via the
                                  currency provider, tabular mono, tone, sign)
              transaction-row.tsx canonical ledger row
              progress-meter.tsx  budget/tithe bar, ok→warning→over tones
  charts/     chart-theme.tsx (shared Recharts tooltip style, axis/grid
              presets, gradient def, useChartMounted, currency formatters) +
              chart-card.tsx. Every chart imports from here; inline tooltip
              styles are banned.
  capture/    The unified add/edit system: capture-sheet.tsx (Expense|Income
              segmented, create+edit modes, amount-first, as-you-type category
              suggestion) + capture-fab.tsx + hooks/use-capture.ts (optimistic
              expense add with Undo). There is exactly ONE movement form.
  layout/     sidebar (desktop), topbar (desktop-only), tab-bar (mobile,
              5 tabs), profile-sheet (mobile secondary nav + switches +
              logout), command-menu (⌘K), site-brand. All consume
              lib/navigation.ts.
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
| Surface / panel | `<Card>` (unmodified) |
| Section/metric label | `label-caps` |
| Big number | `font-mono text-display tabular-nums` |
| Money | `<AmountText amount currency tone signed>` |
| Ledger row | `<TransactionRow>` |
| Stat tile | `<StatCard label value detail href?>` |
| Budget/tithe progress | `<ProgressMeter ratio>` |
| Add/edit a movement | `<CaptureSheet>` (never a bespoke form) |
| Positive / negative amount | `text-positive` / `text-negative` |
| Status chip | `bg-success-subtle text-success` (or warning/danger/info) |
| Chart wrapper | `<ChartCard>` + presets from `charts/chart-theme` |
| Zero data | `<EmptyState>` with an action |
| Async result | Sonner toast (destructive ops offer Undo) |
| New string | `t("English", "Español")` |
| New nav destination | add to `lib/navigation.ts` only |

---

## 7. Gates (enforced by grep before merging UI work)

1. No raw status colors in `src/`:
   `emerald-|rose-\d|amber-\d|red-\d|sky-\d|blue-\d|#10b981` (category-color
   plumbing exempt).
2. No magic values outside `components/ui/`: `rounded-[…rem]`, `text-[…rem]`,
   `tracking-[…]`, `shadow-[0_…]`, `bg-card/96`.
3. No stale route strings outside their redirect stubs.
4. Nav items come only from `lib/navigation.ts`.

---

*Maintained alongside the codebase. Update this file in the same change as any
modification to tokens (`globals.css`), patterns (`components/patterns`),
primitives (`components/ui`), or layout chrome (`components/layout`).*
