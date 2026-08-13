# Budget & Expense — Design System

> Single source of truth for the visual language, foundations, components, and
> interaction patterns of the Budget & Expense application. This document is
> **descriptive** — it codifies the system as implemented — and **prescriptive**
> — new work must conform to it. When code and this document disagree, the
> canonical token definitions in [`src/app/globals.css`](src/app/globals.css)
> win; update this file to match.
>
> **Superseded 2026-08-13** by the Up design pass. The previous version
> described the Hybrid v1 system (light-first, machined chrome figures, groove
> meters, percentage rings, a liquid-glass bottom tab bar). This version
> describes the Up system that replaced it. Reference: captures of the real Up
> app (up.com.au), extracted in
> [`changes/2026-08-13-up-true-mockups.md`](changes/2026-08-13-up-true-mockups.md);
> mockups in [`mockups/up-true/`](mockups/up-true/).

- **Product:** Budget & Expense — a bilingual (EN/ES) personal stewardship,
  budgeting, and expense-tracking app.
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-first
  config) · Base UI primitives · shadcn (`base-nova`) · Framer Motion ·
  Recharts · Supabase · Vercel.
- **Theme model:** **one appearance.** Up has no light/dark duality, so
  `next-themes` is gone along with every toggle. The `dark` variant is still
  declared in `globals.css` so existing `dark:` utilities compile, but nothing
  sets the class and they never match.
- **Surface model:** **dark chrome over a white sheet.** The page ground and
  `--foreground` stay light/ink so text inside cards reads normally; the dark
  layer is applied per surface (`up-chrome`, `up-canvas`, `HERO_SURFACE`, the
  desktop sidebar). This is the single most identity-carrying rule here.

---

## 1. Information architecture

Five core sections; everything else is secondary navigation. The single source
of truth for every nav surface is
[`src/lib/navigation.ts`](src/lib/navigation.ts) (`PRIMARY_NAV` +
`SECONDARY_NAV`). No component may define its own nav list.

| Section | Route | Owns |
|---|---|---|
| **Home** | `/home` | "How am I doing right now" — compact black hero whose headline and daily guide prefer the checkpoint-backed **carried available balance**; its supporting ring/bar remains the selected month's `income − spent` plan pace. Metas-style **Presupuesto** cards only (`kind = spending_limit`; swipe when &gt;3); category donut with legend % (no callout connectors); recent movements. Desktop: movements left, Presupuestos+donut right. Reconciliation is configured in Settings; spendable cash is owned by Home, while net worth stays in Wealth. **Metas** (`contribution_goal`) live on `/budget`, never on Home. See [`docs/balance-carryover.md`](docs/balance-carryover.md). |
| **Movements** | `/movements` (+`/recurring`) | The unified ledger: expenses + income, search/filter tabs, swipe-delete, edit sheets, recurring management. |
| **Budget** | `/budget` | Dual engines: **Presupuestos** (ceilings; 100%=exceeded) + **Metas de aportación** (floors; 100%=success). Compact hero remaining = income − spent. Plan distribution includes both; recommendation from overspent Presupuestos. Methods seed by `budget_role` → `kind`. |
| **Patrimonio** | `/wealth` (+`/accounts`, `/investments`, `/savings`, `/liabilities`, `/loans`) | The personal balance sheet: `netWorth = (accounts + savings + investments + moneyLent) − debts`. Black net-worth hero with the monthly change; quick-glance row (Evolución · Activos y deudas · Colchón financiero); **Organiza tu dinero** (5 category cards → pushed pages); by-currency. In-screen tabs **Resumen · Activos · Deudas**. If it's a balance, it lives here. **Available money is not a Patrimonio headline** — spendable "now" belongs to Home. |
| **Insights** | `/insights` (+`/calendar`, `/categories/[id]`) | What happened and what are the patterns: ratios, pillars, clickable 12-month + daily spend bars (magenta series), envelope utilization, anomalies, monthly report (owns category spend bars), calendar day drilldown. No data-entry CTAs. No duplicate standalone “Where it went” list. |

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
font-size values in components** except:

1. Dynamic **category color** (DB hex via `CategoryBadge` / donut inline style).
2. **Budget usage-band** hex from [`src/lib/palette.ts`](src/lib/palette.ts)
   (Presupuesto trackers). Cashflow amounts use CSS vars
   (`income` / `available` / `expense`). **Patrimonio category accents** come
   from `WEALTH_ACCENTS` in the same file (accounts / savings / investments /
   lent / debts). The **ink chrome surface** is the summary chrome for the three
   screens that lead with one headline figure — **Home, Budget and
   Patrimonio** — import it from
   [`src/components/patterns/hero-surface.tsx`](src/components/patterns/hero-surface.tsx)
   (`HERO_SURFACE`, `HERO_TILE`, `HERO_ICON_TILE`, `HERO_RULE`, `HERO_TRACK`,
   `HERO_ACCENT`, `HERO_ACCENT_NEGATIVE`, `HERO_ACCENT_WARNING`) rather than
   writing ad-hoc `white/xx` values, and do not reuse the surface on ordinary
   cards. It is full-bleed and square on mobile so it continues the rail's ink
   band, and a rounded card on desktop. `HeroSheen` is **gone** — Up is flat.
3. **Insights spend series** `SPEND_CHART_COLOR` (`#EC4899`) in
   [`src/components/charts/chart-theme.tsx`](src/components/charts/chart-theme.tsx)
   — soft magenta for bar fills (matches clarity Health); not `--expense`
   alarm red and not success green.

### 2.1 Color

- **Surfaces/neutrals:** the shadcn set — `background`, `card`, `popover`,
  `secondary`, `muted`, `accent`, `border`, `input`, `ring`, plus the
  `sidebar-*` group. Near-monochrome; color is reserved for meaning.
- **Semantic status tokens**, each with `-foreground` (text on solid) and
  `-subtle` (translucent tint background):
  - `success` — positive confirmation, on-target giving
  - `warning` — needs attention, review queue
  - `danger` — destructive intent (hue-aligned with `destructive`)
  - `info` — neutral information, upcoming bills
- **Up hues** are exposed directly as `--coral` / `--coral-deep` / `--lemon` /
  `--ink` / `--ink-2` / `--ink-3`, usable as `bg-ink`, `text-coral`, etc.
  **Coral `#FF7A64` is both the action colour and the money colour** — that
  double duty is a large part of why the app reads as Up. It is `--primary`,
  so every default Button, focus ring and FAB is coral.
- **Cashflow tokens** (Home stats; also aliased into amount semantics):
  - `income` — `#16A56A` (mint) — money in
  - `available` — `#FF7A64` (coral) — the spendable headline, matching Up's hero
  - `expense` — `#1A1B23` (**ink**) — money out
  - `positive` → `var(--income)`; `negative` → `var(--expense)`
  - Utilities: `text-income`, `text-available`, `text-expense`, `bg-income`, etc.
  - **Outflows are ink, not red.** Up renders money leaving as plain text and
    spends red only on a tracker actually over its limit. Do not "restore" a red
    expense colour — it makes every ordinary purchase read as an alarm.
  - Earlier palettes (`PALETTE_OG` / `PALETTE_V2` / `PALETTE_HYBRID`) remain in
    `src/lib/palette.ts` for a one-flip revert via `ACTIVE_PALETTE`.
- **Budget usage bands** (Presupuesto trackers; source of truth
  `src/lib/palette.ts`, not month-pace):

  | Band | Ratio | Hex |
  |---|---|---|
  | Safe | 0–69% | `#FF7A64` |
  | Watch | 70–84% | `#FF7A64` |
  | Near limit | 85–99% | `#FF7A64` |
  | Exceeded | 100–119% | `#F0453A` |
  | Critical | 120%+ | `#F0453A` |

  **Up does not grade a tracker on its way to the limit.** The bar holds one
  colour the whole way and only turns red once the limit is passed. The five
  bands survive so the API and legends keep working, but the three under-limit
  tones deliberately resolve to the same coral. Do not reintroduce a
  safe → watch → near gradient.
- **Category colors:** data-driven hex on `categories.color` (inline style via
  `CategoryBadge` / donut). Clarity defaults live in `PALETTE.categories` /
  `DEFAULT_CATEGORIES`; Housing is yellow `#EAB308`. Migration
  `2026-07-24-palette-v2-category-colors.sql` updates known EN/ES names on
  live rows.
- **Charts:** `chart-1..5` for generic series, `chart-grid` / `chart-axis` for
  recessive plumbing. Category charts use per-category DB hex. Insights
  **spending** trend bars use `SPEND_CHART_COLOR` (`#EC4899`) — daily bars show
  spend peaks (selected month; current month ends at today); both the 12-month
  and daily charts are clickable (day → calendar sheet, month → Movements
  expenses). Category spend breakdown on Insights lives only inside the
  monthly report, not a second list.
- Usage: `text-success`, `bg-warning-subtle`, `ring-danger/25`, `text-income`,
  etc.

### 2.1.1 Home Presupuesto trackers (composition)

- Component: `src/components/home/budget-pace-chart.tsx` (shared with Budget).
- **Remaining-first.** The headline is what is *left* (`€124 left` /
  `quedan 124 €`) or, past the limit, what it is *over* by (`€38 over` /
  `38 € de más`). **Up never shows a bare percentage**, so the usage ring, the
  `%` numeral and the month-pace mark on the ring are all gone. The only
  quantity on a tracker is an amount.
- Up **Tracker** tiles laid out **side by side, up to 3 per row**: dark
  (`bg-ink-2`) card, category-accent glyph top-left, name in small grey, the
  remaining amount in bold, and a thin accent bar **hugging the card's bottom
  edge, full-bleed to its corners** — not inset. The bar turns red past the
  limit.
- Tile glyph = the `icon` of the category carrying most of that budget's spend;
  no linked categories falls back to `Target`.
- Tiles size themselves off their own width (`@container/budget-card`), so the
  same three fit the narrow Home column and a phone.
- Home lists **only** `spending_limit` envelopes (Presupuestos). Metas stay on
  `/budget`.
- More than 3 → **swipe pages of 3** (snap + dots); pages keep a fixed
  3-column grid so card width never jumps between pages.
- Never treat 100% as success green — that is reserved for Metas on the Budget
  tab. Past the limit the headline amount takes the band colour (red).
- Home: cards link to `/budget`. Budget tab: pass `onSelect` to open the
  edit sheet; a compact manage list below carries delete.
- Hero math: `src/lib/home/month-cashflow.ts` + `HomeSummaryCard`.
  Home's headline prefers the tracked cash balance (latest checkpoint plus all
  later movements), so a month-end balance carries forward. Without tracking,
  it falls back to `monthlyIncome − actualOutflows`. The daily guide uses the
  same headline amount. Budget's hero remains month-only plan pace.
- Budget desktop layout: budgets column left (`lg:col-span-3`); plan column
  right (`lg:col-span-2`). Plan meters use `max-w-xs` — never full-bleed.

### 2.2 Typography

**Inter** throughout, loaded via `next/font` in
[`src/app/layout.tsx`](src/app/layout.tsx) as `--font-inter`. `font-sans`,
`font-mono` and `font-heading` all resolve to it; `font-mono` survives as a
semantic marker for numerals, whose alignment comes from `tabular-nums`.

> **Inter is a STAND-IN.** Up's real typeface is unconfirmed — Brandfetch
> returns 403 and Up's design blog never names it. From the captures it is a
> tight geometric sans with heavy, negatively-tracked numerals. Swap the three
> `--font-*` lines in `globals.css` and the `next/font` import when the real
> family is identified. Do not present Inter as the chosen face.

The scale is tokenized; arbitrary `text-[…rem]` values are banned outside
`components/ui/`:

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

**Up is flat.** Cards separate from the ground by contrast, not by lift. The
three shadows (`--elevation-1/2/3`, exposed as `shadow-1/2/3`) survive but are
now nearly imperceptible: **1** resting · **2** raised (popovers, sticky
headers) · **3** modal/sheet. `<Card>` no longer carries a shadow at all, and
buttons have no drop shadow and no hover lift. The FAB uses the `up-fab-glow`
utility — a halo in coral's own hue, not a neutral drop shadow. One-off
`shadow-[…]` values are banned.

### 2.4 Radius & spacing

Radius derives from `--radius: 0.75rem`: `rounded-lg` (0.75rem) for inputs/nav
rows, `rounded-xl` (1.05rem) for cards, `rounded-2xl`/`rounded-3xl` for
sheets/modals. **Buttons are full pills** (`rounded-full` in the base variant)
and icon buttons are circles — that is Up's control shape. `rounded-full`
remains banned for status pills and tab chips (use `StatusTag` /
`UnderlineTabs`).
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

> **Open conflict, deliberately not resolved.** The mark's emerald slash
> (`#18b986`) predates the Up pass and no longer belongs to this palette, where
> green means money arriving and coral carries the brand. The mark has been left
> exactly as it is: the identity is the owner's call, not a design pass's, and
> regenerating six icon assets is a separate decision. Raise it; don't quietly
> recolour it.

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
              progress-meter.tsx  budget/tithe bar (flat painted `up-track`,
                                  ok→over tones — no machined groove)
              status-tag.tsx      quiet status indicator (tone dot + label in
                                  ink). THE way to show state — never an
                                  uppercase tinted pill.
              underline-tabs.tsx  THE in-screen view switcher (text weight +
                                  hairline indicator). No filled pill/chip
                                  tabs; `@/components/ui/tabs` is retired.
              breakdown-donut.tsx shared thin donut with center total + legend
                                  (share % + amount); used by Home & Wealth.
  charts/     chart-theme.tsx (shared Recharts tooltip style, axis/grid
              presets, gradient def, useChartMounted, currency formatters,
              SPEND_CHART_COLOR) + chart-card.tsx. Every chart imports from
              here; inline tooltip styles are banned.
  capture/    The unified add/edit system: capture-sheet.tsx (Expense|Income
              segmented, create+edit modes, amount-first, as-you-type category
              suggestion) + capture-fab.tsx + hooks/use-capture.ts (optimistic
              expense add with Undo). There is exactly ONE movement form.
              After a successful expense save, envelope-limit toasts may fire
              (see §9).
  onboarding/ First-run wizard + soft client gate (`OnboardingGate` in the
              app layout). Not primary nav.
  layout/     sidebar (desktop, dark chrome), topbar (desktop-only),
              tab-bar (mobile, 5 tabs, floating liquid-glass pill),
              profile-sheet (mobile secondary nav + language row + logout),
              command-menu (⌘K), site-brand. All consume lib/navigation.ts.
              Chrome (Sidebar/Topbar/TabBar/CaptureFab) is hidden on
              `/onboarding`.
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

- `< md`: no topbar. Bottom **`TabBar`** with the 5 sections — a floating
  liquid-glass pill capsule — plus the floating capture FAB bottom-right
  (thumb zone), sitting above it. Main content padding clears the bar +
  `env(safe-area-inset-bottom)`.

  > A top tab rail (Up's own pattern: active section centred, neighbours
  > clipping at the screen edges) was built and then **removed on 2026-08-13 at
  > the owner's request** — the pill is the preferred navigation for this app.
  > Up rejects bottom tab bars; this app does not. Do not "restore" the rail as
  > a fidelity fix.

- Each screen renders its own sticky translucent header via
  `patterns/screen.tsx` — avatar (profile sheet) on root screens, back chevron
  on pushed screens.
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
  language toggle sets an explicit flag and wins over the device after that.
  Soft device defaults are not persisted until the user chooses.
- **Language controls never live in `Screen` header chrome** (they crowd month
  pickers and actions). Placement:
  - **Mobile:** profile sheet — a Language row that toggles EN ↔ ES.
  - **Settings:** full Language preference list (radio).
  - **Desktop / auth:** compact Languages chip where appropriate.
- Amounts are stored in their original currency and converted for display;
  income renders `positive` tone with a `+` sign, expenses render negative.
  When the stored currency differs from the base, ledger rows show the
  original via `AmountText` `showOriginal`.
- Tone: warm, plain-spoken stewardship language — not SaaS boilerplate or
  encyclopedia AI. Domain vocabulary: *stewardship, ledger, envelopes/pool,
  giving, tithe, wisdom*. Brand kicker: **"Stewardship / Mayordomía."**
  Numbers are always formatted, never raw.
- **Giving / Generosidad** hero figures are a **% of income** (plan income
  first), not total expenses. See `docs/APP.md` §5 and `lib/giving.ts`.

---

## 6. Quick reference

| Need | Use |
|---|---|
| Page scaffold | `<Screen title … actions … subheader …>` |
| Pushed-screen back | `<Screen backHref="/safe-fallback">` (history first) |
| Surface / panel | `<Card>` (unmodified) |
| Section/metric label | `label-caps` |
| Big number | `up-figure font-mono text-display tabular-nums` (coral, chrome only) |
| Money | `<AmountText amount currency tone signed>` |
| Ledger row | `<TransactionRow>` |
| Stat tile | `<StatCard label value detail href?>` |
| Budget/tithe progress | `<ProgressMeter ratio>` — default colors = usage bands; pass `tone` to override (Giving) |
| Home Presupuesto trackers | `BudgetPaceChart` — Up Trackers, remaining-first, swipe pages; optional `onSelect` |
| Create / edit a budget | `<BudgetWizard mode="create" \| "edit">` — centered modal (bottom sheet on mobile), 3 steps branching by kind |
| Any 3-step creation flow | `<WizardModal>` in `patterns/wizard-modal.tsx` — Dialog/Sheet switch, step indicator, footer; `useDiscardPanel()` for the discard guard |
| Wizard consequence block | `<FinancialImpact>` + `lib/wealth/transaction-effects.ts` — step 3 must state what the write does |
| Confirm a destructive action | `<ConfirmDialog>` — `window.confirm` is banned |
| Patrimonio category hero | `<WealthCategoryHero>` (ink `HERO_SURFACE`) |
| Home month hero | `HomeSummaryCard` + `lib/home/month-cashflow.ts` |
| Net worth math | `lib/wealth/net-worth.ts` (pure) + `useNetWorth()` — never re-derive a total in a screen |
| Patrimonio hero | `<PatrimonioHero>` (ink `HERO_SURFACE`) |
| Patrimonio category accent | `WEALTH_ACCENTS` in `lib/palette.ts` |
| Cushion / goal meter | `<ProgressMeter tone="…">` — **always pass `tone`** when a full bar is good; the default bands read high as bad |
| Stat tile swatch | `<StatCard swatchClassName="bg-income" …>` |
| Add/edit a movement | `<CaptureSheet>` (await save before close; Save & add another) |
| First-run setup | `/onboarding` + `useOnboarding` / `OnboardingGate` |
| Goal → UI mapping | `lib/onboarding/personalize.ts` (optional `methodId` override) |
| Giving target | `lib/giving.ts` `resolveGivingTarget` |
| Envelope limit check | `lib/budgeting/envelope-alerts.ts` + notify helper |
| Positive / negative amount | `text-positive` / `text-negative` |
| Status chip | `bg-success-subtle text-success` (or warning/danger/info) |
| Chart wrapper | `<ChartCard>` + presets from `charts/chart-theme` |
| Insights spend series | `SPEND_CHART_COLOR` (`#EC4899`) — daily + 12-month bars |
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
6. No theme switching: `next-themes`, `useTheme`, or an appearance toggle
   anywhere in `src/` means the one-appearance rule has been broken.
7. No percentage as a budget headline: a bare `%` numeral on a Presupuesto
   tracker contradicts remaining-first (§2.1.1).

---

## 8. First-run onboarding & goals

Skippable wizard so **new** users can set income, fixed costs, debt, and goals
without blocking the app. Full product handbook:
[`docs/APP.md`](docs/APP.md) §3. Change notes:
`changes/2026-07-18-onboarding-goals-budget-alerts.md`,
`changes/2026-07-18-fix-onboarding-skip-and-new-user-gate.md`,
`changes/2026-07-18-onboarding-choosable-budget-profile.md`.

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
6. Suggestions — **choosable** budget profile (suggested from goals, user can
   pick another) + starter envelopes when help requested  
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

`src/lib/onboarding/personalize.ts` maps answers → method id, seed envelopes
(by `budget_role`), Home CTAs, Attention hints. Optional `methodId` keeps a
user-chosen budget profile. Applied at finish via `lib/onboarding/apply.ts`.
Monthly plan stores **income only** (`allocation_percent` always `100`).
Budget empty/guided copy and Attention read `profile.primary_goals` /
`wants_budget_help`. Desktop Home quick shortcuts were removed 2026-07-24.
No separate goals table in v1.

| Signal | App adjustment |
|---|---|
| `wants_budget_help` | Seed 2–4 starter envelopes from chosen/suggested method |
| User-picked `methodId` | Overrides goal-based method suggestion |
| `budget_tracking` | Attention / empty-state emphasis toward Budget + Movements |
| `decrease_expenses` | Attention → Insights; Budget messaging |
| `save_more` / `build_emergency_fund` | Savings-oriented method; optional Savings envelope |
| `pay_debt` | Attention → Wealth/Liabilities; Wealth CTA |
| `increase_wealth` | Wealth CTA on Home |
| `give_generously` | Giving envelope; `tithe_target_percent` → 10%; ensure Tithe/Diezmo category |

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
