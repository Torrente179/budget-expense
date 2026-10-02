# Budget & Expense — Design System

> Single source of truth for the visual language, foundations, components, and
> interaction patterns of the Budget & Expense application. This document is
> **descriptive** — it codifies the system as implemented — and **prescriptive**
> — new work must conform to it. When code and this document disagree, the
> canonical token definitions in [`src/app/globals.css`](src/app/globals.css)
> win; update this file to match.
>
> **Superseded 2026-10-02** by the **Card Stream** pass, chosen by JP from the
> "2 + 3 · Card Stream" mockup. It replaced the Up-derived system (ink chrome
> over a white sheet, Inter, flat coral figures, a floating capture FAB).
> This version describes Card Stream as implemented. The change is recorded in
> [`changes/2026-10-02-card-stream-redesign.md`](changes/2026-10-02-card-stream-redesign.md).
>
> Card Stream was built screen-by-screen for **Home** and **Budget** and applied
> as a theme everywhere else. Sections below that describe Movements,
> Patrimonio, Insights and the secondary routes still describe their layouts
> correctly, but read every mention of a "white sheet" or "ink chrome" there as
> the card surface and the page ground: those screens took the new colours,
> type, header and navigation without being recomposed.

- **Product:** Budget & Expense — a bilingual (EN/ES) personal stewardship,
  budgeting, and expense-tracking app.
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-first
  config) · Base UI primitives · shadcn (`base-nova`) · Framer Motion ·
  Recharts · Supabase · Vercel.
- **Theme model:** **two appearances** (JP's decision, 2026-10-02): the dark
  Card Stream ground, which is the default, and **Porcelain**, a cool
  near-white ground with white cards. The preference is Light, Dark or Match
  device, chosen in Settings (and the phone profile sheet), stored in the
  `be_theme` cookie and rendered by the server as `data-theme` on `<html>`.
  The stylesheet does the rest, including following the device for "system",
  so there is no script before first paint. `ThemeProvider`
  (`src/providers/theme-provider.tsx`) only holds and changes the preference.
  The public pages (landing, auth, onboarding, error, 404) pin themselves dark
  with `data-theme="dark"` on their root; they have no light version yet.
- **Surface model:** **one flat ground, with slightly lifted surfaces on it**
  — warm near-black in the dark appearance, cool near-white in Porcelain. The
  page ground is `--background`; cards, sheets and rows that need an edge use
  `--card` with a one-pixel `--border` ring. There is no separate chrome band.
  Each palette is one block in `globals.css` — changing a palette means editing
  its block and nothing else.

---

## 1. Information architecture

Five core sections; everything else is secondary navigation. The single source
of truth for every nav surface is
[`src/lib/navigation.ts`](src/lib/navigation.ts) (`PRIMARY_NAV`, `MENU_NAV`,
`REVIEW_NAV`, `IMPORT_NAV`, and `SECONDARY_NAV` as the full list for search).
No component may define its own nav list.

| Section | Route | Owns |
|---|---|---|
| **Home** | `/home` | "How am I doing right now". The header's title is the month (a popover month switch). Phone: the **balance card** (checkpoint-backed available balance on a physical accent card, with the daily guide and pace status printed on it), In/Out beneath it, **Trackers as one swipeable row of pills**, then the **feed** — the next scheduled payment first, then movements grouped by day, each day headed by its own out/in totals — and the month's category split last. Desktop (from `xl`, 1280px; narrower windows keep the phone composition next to the sidebar): the balance card sits beside a **This month** panel (In, Out, Left in plan, pace bar); below, the feed takes the wide column and a rail carries a Trackers panel and the category split. **Savers/Metas** (`contribution_goal`) live on `/budget`, never on Home. See [`docs/balance-carryover.md`](docs/balance-carryover.md). |
| **Movements** | `/movements` (+`/recurring`) | Dense unified ledger: one net-month hero, secondary money-in/out context, subdued URL-backed search/filters, chronological white sheet, swipe-delete/edit/undo, and a day-rail recurring schedule. |
| **Budget** | `/budget` | Two explicit views behind underline tabs: **Trackers/Presupuestos** (ceilings; remaining-first and red only when exceeded) and **Savers/Metas** (contribution floors; completion is positive). The headline is one large figure on the page ground — what is left across all Trackers, or what has been put toward Savers. Trackers render as a **wallet**: one coloured card per limit, stacked, one open at a time. The plan tools (income, methods, copy last month, distribution, recommendation) sit in a **Plan** section: below on a phone, a sticky right column from `xl` (1280px). The plan, recommendation, setup, percentage, warning, and CRUD engines are unchanged. |
| **Patrimonio** | `/wealth` (+`/accounts`, `/investments`, `/savings`, `/liabilities`, `/loans`) | The personal balance sheet: `netWorth = (accounts + savings + investments + moneyLent) − debts`. One dominant ink net-worth hero flows into a continuous white asset/debt sheet with dense category rows, trend/cushion analysis, by-currency context, and pushed workflows. If it's a balance, it lives here. **Available money is not a Patrimonio headline** — spendable "now" belongs to Home. |
| **Insights** | `/insights` (+`/calendar`, `/categories/[id]`) | What happened and what are the patterns: one month-spend chrome hero followed by a continuous divided report containing ratios, pillars, clickable 12-month + daily spend bars, Tracker utilization, anomalies, monthly analysis, giving, income sources, and calendar/category drilldowns. No decorative unsupported time controls and no data-entry CTAs. |

Secondary: `/review`, `/import`, `/wisdom`, `/settings` — compact list/sheet
surfaces. All four are in the command menu (⌘K). Where each one lives
otherwise (JP's pick, 2026-10-02, option C on the "Open Choices" canvas):

- **Wisdom, Settings** — the "More" group: desktop sidebar, phone profile sheet.
- **Review** — no menu row. Home shows a `ReviewPrompt` card whenever movements
  are waiting (under the Tracker pills on a phone, top of the right rail from
  `xl`); with nothing waiting the card is absent.
- **Import** — an action, not a section: a button at the foot of the desktop
  sidebar, and a pill beside the month picker on Movements below `md`.

Import copy remains Santander/Wise.

**Public landing page:** `/` — the only marketing surface, and the only route a
signed-out visitor reaches besides the auth forms. It is not an app screen: it
does not use `Screen`, `TabBar` or `Sidebar`, and it is the one place a
language control may sit in a page header (§5 already allows this for the auth
surface). Its device frames render the **real** components wherever those are
free of viewport breakpoints — `HomeActivitySheet`, `TransactionRow`,
`BudgetTrackerCard` — so a marketing screenshot cannot drift from the product.
Frames are `inert` and `role="img"`: a visitor is looking at a picture of the
app, not a copy of it. Utilities `device-phone`, `device-window`,
`landing-display` and `landing-title` in `globals.css` exist only for it, and
are the only sanctioned fixed-pixel values in the system because they are
device geometry rather than tokens.

**First-run:** `/onboarding` — skippable setup wizard (not in primary nav),
presented as a full-screen coral story with accessible ink-backed lemon display
type and an opaque white form sheet.
See [§8 First-run onboarding & goals](#8-first-run-onboarding--goals).

Old routes (`/dashboard`, `/movimientos`, `/budgets`, `/analytics`,
`/calendar`, `/investments/*`, `/expenses`, `/incomes`) are **permanent
redirect stubs** — never delete them; installed PWAs may deep-link to them.

**Editorial rule** (tie-breaker for where a feature lives): Home = now +
actionable · Insights = past + patterns · Wealth = balances. A metric may not
live in more than one section.

---

## 2. Foundations

All tokens live in [`src/app/globals.css`](src/app/globals.css): the dark values
on `:root`, the Porcelain values in the `theme-light` block after it, both
exposed to Tailwind through `@theme inline`. Components never branch on the
theme; they use tokens, and a colour that must differ between appearances gets
a token. `text-white`, `bg-white/…`, `border-white/…` and `bg-ink` are not
used on app screens (the pinned-dark public pages and the coloured wallet and
balance cards are the exceptions). The accent has two roles: `--coral` is the
fill (balance card, buttons) and `--coral-ink` is the accent as text or an
icon — `text-coral` and `text-primary` resolve to it. In Porcelain it is a
burnt orange and `--danger` is a cool crimson, so accent text and an
over-limit figure never read as the same colour. Never hard-code
hex, shadow, radius, or font-size values in components except:

1. Dynamic **category color** (DB hex via `CategoryBadge` / donut inline style).
2. **Budget usage-band** hex from [`src/lib/palette.ts`](src/lib/palette.ts)
   (Presupuesto trackers). Cashflow amounts use CSS vars
   (`income` / `available` / `expense`). **Patrimonio category accents** come
   from `WEALTH_ACCENTS` in the same file (accounts / savings / investments /
   lent / debts). The **hero band** (`HERO_SURFACE`) opens Movements, Recurring
   and Patrimonio — import it from
   [`src/components/patterns/hero-surface.tsx`](src/components/patterns/hero-surface.tsx)
   (`HERO_SURFACE`, `HERO_TILE`, `HERO_ICON_TILE`, `HERO_RULE`, `HERO_TRACK`,
   `HERO_ACCENT`, `HERO_ACCENT_NEGATIVE`, `HERO_ACCENT_WARNING`) rather than
   writing ad-hoc `white/xx` values, and do not reuse the surface on ordinary
   cards. It is flush with the page ground and full-bleed on mobile, and a
   rounded card on desktop. Home and Budget no longer use it: Home leads with
   the balance card and Budget with a bare figure.
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
- **Accent** is coral `--coral` (`#FF7A64`), usable as `bg-coral` /
  `text-coral`, and aliased to `--primary`. On the dark ground coral passes
  contrast as text, so there is no separate "deep" text variant;
  `--coral-deep` is now the *lighter* hover tone. Text and icons that sit on a
  coral fill use `--on-coral` (`text-on-coral`). **Coral is the accent and the
  balance card; it is not a status.**
- **`--ink`, `--ink-2`, `--ink-3`** survive as aliases for the ground, the card
  surface and the raised surface, so older `bg-ink` chrome blends into the
  page. New work uses `bg-background`, `bg-card`, `bg-surface-2`.
- **Cashflow tokens**:
  - `income` — mint `#6FE3B0` — money in
  - `available` — coral — the spendable headline
  - `expense` — the foreground text colour — money out
  - `positive` → `var(--income)`; `negative` → `var(--expense)`
  - **Outflows are plain text, not red.** Red is spent only on a tracker
    actually over its limit. Do not "restore" a red expense colour — it makes
    every ordinary purchase read as an alarm.
  - Earlier palettes (`PALETTE_OG` / `PALETTE_V2` / `PALETTE_HYBRID`) remain in
    `src/lib/palette.ts`.
- **Budget usage bands** (Presupuesto trackers; source of truth
  `src/lib/palette.ts`, not month-pace):

  | Band | Ratio | Hex |
  |---|---|---|
  | Safe | 0–69% | `#FF7A64` |
  | Watch | 70–84% | `#FF7A64` |
  | Near limit | 85–99% | `#FF7A64` |
  | Exceeded | 100–119% | `#F65B50` |
  | Critical | 120%+ | `#F65B50` |

  **A tracker is not graded on its way to the limit.** The bar holds one
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

### 2.1.1 Trackers (composition)

- **Remaining-first, everywhere.** A tracker's headline is what is *left*
  (`€124 left` / `quedan 124 €`) or, past the limit, what it is *over* by
  (`€38 over` / `38 € de más`). **Never a bare percentage.** Cents are dropped
  when there are none (`formatCurrencyTrim`).
- **Home, phone:** `TrackerPills` in `src/components/home/tracker-pills.tsx` —
  one horizontally scrolling row of pills, each a category-tinted dot, the
  name and the headline. Every tracker is in the row; it scrolls, it does not
  page. An over-limit pill takes the danger tint.
- **Home, desktop:** `TrackerList` (same file) — a panel in the right rail, one
  row per tracker with a thin bar.
- **Budget:** `TrackerWallet` in `src/components/budget/tracker-wallet.tsx` — a
  stack of coloured cards, each card's top strip always visible (glyph, name,
  headline, thin bar). One card is open at a time and shows spent-of-limit, a
  thicker bar, "Resets in N days", Edit and Delete. A card's colour is its
  leading category's colour mixed about half with black so white text stays
  legible; an over-limit card takes one fixed red whatever its category.
- Bars are the accent under the limit and red once past it — never a
  safe → watch → near gradient.
- Home lists **only** `spending_limit` envelopes. Metas stay on `/budget`.
- Never treat 100% as success green — that is reserved for Metas.
- Hero math: `src/lib/home/month-cashflow.ts`. Home's balance card prefers the
  tracked cash balance (latest checkpoint plus all later movements), so a
  month-end balance carries forward. Without tracking it falls back to
  `monthlyIncome − actualOutflows`. Budget's headline is tracker-level (sum of
  limits − sum of spend); its Plan card remains month-only plan pace.

### 2.2 Typography

**Manrope** throughout, loaded via `next/font` in
[`src/app/layout.tsx`](src/app/layout.tsx) as `--font-manrope`. `font-sans`,
`font-mono` and `font-heading` all resolve to it; `font-mono` survives as a
semantic marker for numerals, whose alignment comes from `tabular-nums`.

Hero figures use `<MoneyFigure>` (`patterns/money-figure.tsx`): a very large
whole number with the currency sign and cents set small and raised beside it,
stepping down in size as the figure gets longer. It is the one sanctioned place
for hero-size numerals — the balance card and Budget's headline.

The scale is tokenized; arbitrary `text-[…rem]` values are banned outside
`components/ui/`:

| Token | Size | Use |
|---|---|---|
| `text-display` | 2.625rem | Mobile money heroes (42px; within the 40–44px target) |
| `text-title` | 1.375rem | Screen titles, large amounts |
| `text-heading` | 1.0625rem | Card/section titles |
| `text-body` | 0.9375rem | Default body and compact 15px rows |
| `text-caption` | 0.75rem | Secondary/meta text |
| `text-label` | 0.6875rem | Micro labels |
| `label-caps` (utility) | — | The eyebrow: label size, uppercase, 0.12em tracking, muted color |

Tracking: `tracking-tight` on large numerals/titles, `tracking-widest` on
uppercase micro-badges. Arbitrary `tracking-[…]` values are banned.

### 2.3 Elevation

Surfaces separate from the ground by a one-step lighter fill and a one-pixel
`ring-border`, not by lift. `<Card>`, popovers, menus, buttons and sheets carry
no decorative drop shadow. Three things do cast one, because they are objects
rather than regions: the **balance card** (`balance-card`, an accent-coloured
shadow), the **wallet cards** (`wallet-card`, a shadow onto the card beneath)
and the **floating tab bar** (`shadow-3`). One-off `shadow-[…]` values are
banned.

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

Use one vocabulary: press feedback is 100ms and scales to 0.98; ordinary state
changes use 220–260ms (the shared token is 240ms); sheets enter in 280ms and
exit in 200ms; one-shot success/progress moments may run 450–650ms (560ms
default). Lists stagger by 30ms for only the first six visible rows. Never loop
decorative motion and never add whole-page swipe navigation. Saver particles,
if used later, run only on entry or successful progress. `prefers-reduced-motion`
collapses all nonessential animation globally.

### 2.6 Brand identity & app icon

The canonical product mark is the existing condensed, forward-leaning
warm-white **B** with its ledger/growth slash, set on a near-black rounded
superellipse with a restrained graphite rim. The silhouette, proportions,
padding, and artwork are unchanged. The former green slash is deterministically
recoloured coral to join the one-appearance product system; no part of the mark
was generatively redrawn.

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
              rounded-xl bg-card ring-1 ring-border — use <Card>
              unmodified, never re-style it per call site.
              sheet.tsx: opaque white, modest top radius, drag handle,
              keyboard-safe sticky footer, and safe-area padding.
  patterns/   Composed building blocks — reach for these before new markup:
              screen.tsx          solid app-screen scaffold with `chrome-sheet`,
                                  `dark-canvas`, and `plain` modes; back/avatar,
                                  actions, subheader and desktop utilities.
                                  When `backHref` is set, Back calls
                                  `router.back()` if history exists; else
                                  navigates to `backHref` (deep-link/refresh
                                  fallback). Never hard-code `/home` as the
                                  only back target.
              continuous-sheet.tsx one uninterrupted white content plane with
                                  divided `SheetSection` chapters; use this for
                                  primary reports and dense balance/ledger
                                  surfaces instead of stacked generic cards.
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
              contextual sheets   opaque white sheets that preserve the
                                  initiating object's context and restore focus.
  charts/     chart-theme.tsx (shared Recharts tooltip style, axis/grid
              presets, gradient def, useChartMounted, currency formatters,
              SPEND_CHART_COLOR) + chart-card.tsx. Every chart imports from
              here; inline tooltip styles are banned.
  capture/    The unified add/edit system: capture-sheet.tsx (Expense|Income
              segmented, create+edit modes, amount-first, as-you-type category
              suggestion) + capture-fab.tsx + hooks/use-capture.ts (optimistic
              expense add with Undo). There is exactly ONE movement form.
              `capture-button.tsx` holds `CaptureProvider` (one persistent
              sheet host in the app layout) and `CaptureButton`, the accent
              circle `Screen` puts last in every header. There is no floating
              FAB. After a successful expense save, envelope-limit toasts may
              fire (see §9).
  onboarding/ First-run wizard + reusable `OnboardingStoryShell` + soft client
              gate (`OnboardingGate` in the app layout). Not primary nav.
  layout/     sidebar (desktop; on the page ground behind one hairline, the
              active section a raised pill with an accent icon — `SidebarView`
              is the presentational half the fixtures render),
              tab-bar (mobile, 5 tabs, a floating translucent capsule),
              profile-sheet (mobile secondary nav + language row + logout),
              command-menu (⌘K), site-brand. All consume lib/navigation.ts.
              Desktop search, language, and currency controls are integrated
              in solid `Screen` headers; there is no separate glass topbar.
              Chrome (Sidebar/TabBar/CaptureFab) is hidden on
              `/onboarding`.
  design/     `/__design/up` fixture review: deterministic production Home,
              Movements, Recurring, Budget, Capture, Wealth, Insights, and
              onboarding presentation components; no Supabase/API access,
              noindex, and fail-closed outside an explicit non-production flag.
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

- `< md`: no topbar. Bottom **`TabBar`** with the 5 sections — a floating,
  slightly translucent capsule with a coral active state. There is **no
  floating capture button**: adding a movement is the accent `+` at the end of
  every screen header. Main content padding clears the bar +
  `env(safe-area-inset-bottom)`.

- Each screen renders one header row via `patterns/screen.tsx`: back chevron
  (pushed screens), title, the screen's own actions, search, the profile
  trigger (below `lg`), then the accent add-movement button. Language and
  currency join the row from `lg` up. Home's title is the month.
- **Back** on pushed screens = previous page (`router.back()`), with
  `backHref` as the safe fallback when there is no history (refresh / deep
  link). Do not replace this with a hardcoded `/home` Link.
- All create/edit forms are **bottom sheets** with drag handle and sticky
  submit row (keyboard-safe). Desktop uses side sheets/dialogs.
- Lists are full-bleed edge-to-edge rows (min-h-16, ≥44px targets) with
  swipe-to-delete (+ undo toast) and pull-to-refresh; desktop wraps the same
  rows in a Card and reveals delete on hover.
- Horizontal stat rows scroll with snap on mobile, grid on desktop.
- Viewport: `viewportFit: "cover"`; `generateViewport` sets the theme color to
  the page ground of the chosen appearance (per device scheme for "Match
  device"). `manifest.ts` stays on the dark ground.

---

## 5. Language, currency & voice

- Every user-facing string ships EN + ES via `t(en, es)`; category names go
  through `tc()`. Layouts must tolerate ±35% text-length variance.
- **Default language** follows the device / browser primary language
  (`Accept-Language` on first paint, then `navigator.language`). Spanish →
  `es`; anything else (including English) → `en`. A choice in Settings or the
  language toggle sets an explicit flag and wins over the device after that.
  Soft device defaults are not persisted until the user chooses.
- **Language controls stay out of mobile `Screen` chrome** so month pickers and
  actions keep the full width. Placement:
  - **Mobile:** profile sheet — a Language row that toggles EN ↔ ES.
  - **Settings:** full Language preference list (radio).
  - **Desktop / auth:** compact language control integrated into the solid
    route header or branded auth surface.
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
| Page scaffold | `<Screen mode="chrome-sheet" \| "dark-canvas" \| "plain" …>` |
| Pushed-screen back | `<Screen backHref="/safe-fallback">` (history first) |
| Continuous primary report | `<ContinuousSheet>` + `<SheetSection>` |
| Compact secondary panel | `<Card>` (flat, no shadow) |
| Section/metric label | `label-caps` |
| Big number | `<MoneyFigure amount currency>` — the balance card and Budget's headline only |
| Money | `<AmountText amount currency tone signed>` |
| Ledger row | `<TransactionRow>` |
| Stat tile | `<StatCard label value detail href?>` |
| Budget/tithe progress | `<ProgressMeter ratio>` — default colors = usage bands; pass `tone` to override (Giving) |
| Home Trackers | `TrackerPills` (phone row) / `TrackerList` (desktop panel) — remaining-first |
| Budget Trackers | `TrackerWallet` — stacked cards, one open at a time |
| Home spending breakdown | `SpendingBreakdown` — compact stacked strip + ranked category rows |
| Home feed | `HomeActivitySheet` — next scheduled payment, then movements by day with per-day totals |
| Create / edit a budget | `<BudgetWizard mode="create" \| "edit">` — centered modal (bottom sheet on mobile), 3 steps branching by kind |
| Any 3-step creation flow | `<WizardModal>` in `patterns/wizard-modal.tsx` — Dialog/Sheet switch, step indicator, footer; `useDiscardPanel()` for the discard guard |
| Wizard consequence block | `<FinancialImpact>` + `lib/wealth/transaction-effects.ts` — step 3 must state what the write does |
| Confirm a destructive action | `<ConfirmDialog>` — `window.confirm` is banned |
| Patrimonio category hero | `<WealthCategoryHero>` (ink `HERO_SURFACE`) |
| Home hero | `HomeBalanceCard` (+ `HomeMonthPanel` on desktop) + `lib/home/month-cashflow.ts` |
| Add-movement entry | `<CaptureButton>` — rendered by `Screen`; do not add a second one |
| Month switch in a header | `<MonthTitle variant="title" \| "pill">` |
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
2. No legacy material effects or magic values: `backdrop-blur`, gradients,
   decorative `shadow-*`, `rounded-[…rem]`, `text-[…rem]`, `tracking-[…]`, or
   `bg-card/96` outside explicit owned artwork/geometry exceptions. Card
   Stream owns these exceptions and no others:
   - `backdrop-blur-xl` on the `Screen` header and the phone tab bar;
   - the gradient, grain and glow of the `balance-card` utility, and the
     colour fill of the `wallet-card` utility (both defined once in
     `globals.css`);
   - `MoneyFigure`'s hero size steps, which are arbitrary `text-[…rem]`
     values because the integer has to shrink as it gets longer.
   Every other size comes from the type scale (`text-display`, `text-screen`,
   `text-title`, `text-heading`, `text-body`, `text-detail`, `text-caption`,
   `text-label`, `text-nav`). New names added to the scale must also be added
   to the `font-size` group in `src/lib/cn.ts`, or `cn()` will drop them next
   to a text colour.
3. No stale route strings outside their redirect stubs.
4. Nav items come only from `lib/navigation.ts`.
5. Language and currency switches appear in the `Screen` header from `lg` up
   only. Below `lg` they stay in Settings / the profile sheet.
6. One theme mechanism: the `be_theme` cookie, `data-theme` on `<html>` and
   the token blocks in `globals.css`. No `next-themes`, no `.dark` class
   toggling, no component reading the theme to pick a colour, and no
   `text-white` / `bg-white/…` / `bg-ink` on app screens.
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
