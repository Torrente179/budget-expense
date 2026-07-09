# Budget & Expense — Design System

> Single source of truth for the visual language, foundations, components, and
> interaction patterns of the Budget & Expense application. This document is
> **descriptive** — it codifies the system as it is implemented in code — and
> **prescriptive** — new work should conform to it. When code and this document
> disagree, the canonical token definitions in
> [`src/app/globals.css`](src/app/globals.css) win; update this file to match.

- **Product:** Budget & Expense — a bilingual (EN/ES) personal stewardship,
  budgeting, and expense-tracking app.
- **Stack:** Next.js 16 (App Router, RSC) · React 19 · Tailwind CSS v4
  (CSS-first config) · Base UI (`@base-ui/react`) primitives · shadcn
  (`base-nova` style) · Framer Motion · Recharts · Supabase · Vercel.
- **Theme model:** class-based light/dark via `next-themes`, **dark by default**,
  system preference enabled.

---

## 1. Design Principles

These principles explain *why* the system looks and behaves the way it does, and
act as tie-breakers when guidance is ambiguous.

1. **Calm, premium, financial.** The product handles money and stewardship. The
   surface should feel composed and trustworthy — soft neutrals, generous
   radius, deep diffuse shadows, restrained color. Color is reserved for
   *meaning* (positive/negative, category identity), never decoration.
2. **Content first, chrome second.** Navigation and toolbars recede (muted
   foreground, translucent backgrounds, blur). Data and amounts are the loudest
   elements on every screen.
3. **One accent, many neutrals.** The palette is almost monochrome. A single
   green (`--chart-1`) signals positive/growth; a single rose (`--destructive`)
   signals negative/risk. Everything else is a neutral step.
4. **Numbers are typographically special.** All monetary and tabular figures use
   a monospaced, `tabular-nums` treatment so columns align and digits don't
   shift width.
5. **Responsive, not adaptive-by-accident.** Distinct, intentional layouts for
   mobile (bottom nav, stacked overviews) and desktop (fixed sidebar, multi-
   column grids). The `md` (768px) breakpoint is the primary fork.
6. **Bilingual by construction.** Every string ships EN + ES via `t(en, es)`.
   Layouts must tolerate ±35% text-length variance.
7. **Motion clarifies, never entertains.** Short (≤240ms), eased transitions for
   route changes and entrances. No looping or attention-seeking animation.
8. **Accessible defaults.** Visible focus rings, `sr-only` labels on icon-only
   controls, semantic HTML, AA-targeted contrast.

---

## 2. Foundations

### 2.1 Color

Color is defined as CSS custom properties on `:root` (light) and `.dark`, then
exposed to Tailwind v4 through the `@theme inline` block in
[`globals.css`](src/app/globals.css). **Always consume color via the semantic
token** (e.g. `bg-card`, `text-muted-foreground`, `border-border`) — never
hard-code hex values in components. The one sanctioned exception is dynamic,
data-driven category color (see §2.1.4).

#### 2.1.1 Semantic tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `background` | `#f4f6f8` | `#070809` | App canvas (augmented by gradient, §2.3.5) |
| `foreground` | `#15181f` | `#f5f7fa` | Primary text |
| `card` | `#ffffff` | `#101114` | Card / elevated surface |
| `card-foreground` | `#15181f` | `#f5f7fa` | Text on cards |
| `popover` | `#ffffff` | `#101114` | Popover / dialog / menu surface |
| `popover-foreground` | `#15181f` | `#f5f7fa` | Text on popovers |
| `primary` | `#111318` | `#f3f4f6` | Primary action (inverts per theme) |
| `primary-foreground` | `#f7f8fa` | `#090a0c` | Text/icon on primary |
| `secondary` | `#eceff3` | `#17191d` | Subtle fills, chips, secondary buttons |
| `secondary-foreground` | `#171b24` | `#eff2f6` | Text on secondary |
| `muted` | `#eef1f4` | `#111318` | Muted fills, tracks, skeletons |
| `muted-foreground` | `#66707f` | `#8a92a2` | Secondary text, labels, icons |
| `accent` | `#e7eaee` | `#17191d` | Hover wash / accent fill |
| `accent-foreground` | `#171b24` | `#eff2f6` | Text on accent |
| `destructive` | `#cb6078` | `#ec6b86` | Negative / danger / delete (rose) |
| `border` | `rgba(17,19,24,.08)` | `rgba(255,255,255,.07)` | Hairline borders |
| `input` | `rgba(17,19,24,.08)` | `rgba(255,255,255,.08)` | Field borders |
| `ring` | `#111318` | `#dde2ea` | Focus ring |

**Sidebar** has its own parallel set so navigation chrome can be tuned
independently: `sidebar`, `sidebar-foreground`, `sidebar-primary`(+`-foreground`),
`sidebar-accent`(+`-foreground`), `sidebar-border`, `sidebar-ring`. In light mode
`sidebar` is a translucent near-white (`rgba(250,251,252,.92)`); in dark it's a
near-black (`#090a0c`).

#### 2.1.2 Positive / success accent

Positive financial states (available balance ≥ 0, spend down vs. last month) use
an **emerald** accent applied as utility classes rather than a named token:

- Fill: `bg-emerald-500/10`–`/12` · Text: `text-emerald-300` · Border:
  `border-emerald-500/18`.

> Convention: `destructive` = negative/over/risk, **emerald** = positive/under/
> growth, `chart-1` = the data-viz equivalent of the same green. Keep these
> aligned. (Candidate for promotion to a named `--success` token.)

#### 2.1.3 Chart palette

Sequential/categorical palette for data viz, theme-aware:

| Token | Light | Dark | Typical use |
|---|---|---|---|
| `chart-1` | `#18b986` | `#18c58f` | Primary series / positive (green) |
| `chart-2` | `#6e7686` | `#6f7786` | Secondary (slate) |
| `chart-3` | `#9ba5b4` | `#97a0af` | Tertiary (light slate) |
| `chart-4` | `#cf5b76` | `#d55f79` | Contrast / negative (rose) |
| `chart-5` | `#c5ccd6` | `#c4cad4` | Quaternary (pale) |

Charts reference these as `var(--chart-1)` etc. so they re-theme automatically.

#### 2.1.4 Category colors (data-driven)

Expense categories carry their own brand hue, stored per-category and rendered
dynamically. Defaults in [`constants.ts`](src/lib/constants.ts):

`Food #ef4444` · `Transport #f97316` · `Housing #eab308` · `Utilities #84cc16` ·
`Entertainment #06b6d4` · `Shopping #8b5cf6` · `Healthcare #ec4899` ·
`Education #6366f1` · `Travel #14b8a6` · `Subscriptions #f43f5e` ·
`Groceries #22c55e` · `Other #64748b`.

**Rendering rule** (see [`category-badge.tsx`](src/components/shared/category-badge.tsx)):
the raw hex is the foreground/icon color; backgrounds and borders are derived by
appending hex-alpha suffixes — **`color + "15"` for fill (~8%)**, **`color + "24"`
for border (~14%)**. This keeps any hue legible on light or dark surfaces without
per-color tuning.

#### 2.1.5 Contrast & usage rules

- Body text uses `foreground`; supporting text uses `muted-foreground`. Do not
  drop below `muted-foreground` for any text a user must read.
- Borders are intentionally faint (≤8% alpha). Lean on the radius + shadow + ring
  combination (§2.5) for separation, not heavy strokes.
- `::selection` is `primary` at 18% alpha.

### 2.2 Typography

#### 2.2.1 Font families

Loaded via `next/font/google` in [`layout.tsx`](src/app/layout.tsx) and exposed
as CSS variables / Tailwind families:

| Family | Variable | Tailwind | Use |
|---|---|---|---|
| **Geist Sans** | `--font-geist-sans` | `font-sans` | All UI text (default on `html`) |
| **Geist Sans** | `--font-heading` → Geist Sans | `font-heading` | Headings, stat values, titles |
| **Geist Mono** | `--font-geist-mono` | `font-mono` | Currency, tabular numbers, code-like data |
| **Instrument Serif** | `--font-instrument-serif` | — | Loaded & available; not currently mapped in `@theme`. Reserve for editorial/“wisdom” accents. |

> Note: `--font-heading` currently aliases Geist Sans, so headings are
> sans-serif and the system is effectively **two-family** (Geist Sans + Geist
> Mono). If a serif display voice is desired, point `--font-heading` at
> `--font-instrument-serif`.

`text-rendering: optimizeLegibility` and `antialiased` are set globally.

#### 2.2.2 Type scale & roles

The system favors a few deliberate, oversized display sizes over a long ramp.

| Role | Size / classes | Weight | Tracking | Where |
|---|---|---|---|---|
| Page title (H1) | `1.75rem` → `lg:2.45rem`, `leading-none` | 600 | `-0.04em` | `PageHeader` |
| Section display | `1.55rem`, `font-heading` | 600 | `tight` | Chart card titles |
| Hero stat / KPI | `2.15rem`, `font-heading`, `leading-none` | 600 | `-0.045em` | Summary cards |
| Card title | `text-base` (`1rem`), `font-heading`, `leading-snug` | 600 | `tight` | `CardTitle` |
| Body | `text-sm` (`0.875rem`), `leading-6` | 400 | normal | Default copy |
| Body large | `0.95rem` | 400 | normal | Page descriptions (lg+) |
| Label / value | `text-sm` | 500 | normal | Form labels, list values |
| Caption | `text-xs` (`0.75rem`) | 400–500 | normal | Secondary metadata, badges |
| Eyebrow / overline | `~0.7–0.72rem`, **uppercase** | 500 | `0.26em`–`0.28em` | KPI labels, topbar, brand kicker |
| Micro (nav) | `9px`, `leading-none` | 500 | `-0.01em` | Mobile bottom-nav labels |

**Signature patterns**
- **Negative tracking on display** (`-0.04em`/`-0.045em`) gives large headings a
  tight, premium feel.
- **Wide-tracked uppercase eyebrows** (`tracking-[0.28em] text-muted-foreground`)
  label every KPI and section. This is the system's most recognizable motif —
  reuse it for new metric/section labels.
- Numbers: `font-mono tabular-nums` everywhere money appears
  ([`currency-display.tsx`](src/components/shared/currency-display.tsx)).

### 2.3 Spacing, Layout & Grid

#### 2.3.1 Spacing scale

Standard Tailwind 4px base step. Common rhythm in this app:
- **Intra-component gaps:** `gap-1.5` / `gap-2` / `gap-3` (6/8/12px).
- **Card internal padding:** `p-4` default, `p-5` for feature cards, `p-3` for
  `size="sm"` cards.
- **Stacked sections on a page:** `space-y-8` (32px) between major blocks;
  `space-y-4` within a block.
- **Grid gutters:** `gap-4` (16px) for card grids.

#### 2.3.2 Breakpoints

| Name | Min width | Primary use |
|---|---|---|
| `sm` | 640px | Padding step-ups, show currency/lang switch |
| `md` | **768px** | **Layout fork:** sidebar appears, bottom nav hides, density zoom |
| `lg` | 1024px | Page-header row layout, larger title, descriptions show |
| `xl` | 1280px | 3–4 column KPI/card grids |

#### 2.3.3 Page container & content width

- Global content max width: **`max-w-[1480px]`**, centered (`mx-auto`).
- Page padding: `p-4 sm:p-5 lg:p-8`.
- This container is shared by the topbar inner row and the main content so they
  align to the same gutters.

#### 2.3.4 Density (zoom)

On `md` and up the root applies a **90% zoom** (`zoom: 90%`, with a
`font-size: 90%` fallback for engines without `zoom`). Desktop is intentionally
denser than browser default; design and review desktop screens at this scale.

#### 2.3.5 Canvas background

The body is not flat — it layers a subtle radial highlight + vertical gradient,
`background-attachment: fixed`:
- Light: radial `rgba(17,19,24,.04)` top-right + linear `#f7f9fb → #f4f6f8 →
  #edf1f4`.
- Dark: radial `rgba(255,255,255,.035)` top-left + linear `#0b0c0f → #08090b →
  #070809`.

Cards sit at `bg-card/96` (slight translucency) so this canvas reads faintly
through them.

### 2.4 Border Radius

Radius is generous and is the backbone of the “soft” aesthetic. Base token
`--radius: 1rem`; the scale is multiplicative (`@theme inline`):

| Tailwind | Formula | ≈ value | Typical use |
|---|---|---|---|
| `rounded-sm` | `radius × 0.6` | 0.6rem | Tiny controls (xs buttons) |
| `rounded-md` | `radius × 0.8` | 0.8rem | Small buttons, tabs |
| `rounded-lg` | `radius × 1.0` | 1rem | Default control radius |
| `rounded-xl` | `radius × 1.4` | 1.4rem | Buttons, inputs |
| `rounded-2xl` | `radius × 1.8` | 1.8rem | Icon buttons, topbar controls |
| `rounded-3xl` | `radius × 2.2` | 2.2rem | Large containers |
| `rounded-4xl` | `radius × 2.6` | 2.6rem | Badges (pill) |

**Notable literals**
- Cards: `rounded-[calc(var(--radius)*1.35)]` ≈ **1.35rem**.
- Dialog: `rounded-[1.6rem]`.
- Nav items: `rounded-[1.15rem]`; mobile nav tiles `rounded-[1rem]`.
- Pills/badges: `rounded-full` / `rounded-4xl`.

> Rule of thumb: the larger the surface, the larger the radius. Keep new surfaces
> on this curve rather than introducing arbitrary values.

### 2.5 Elevation & Shadows

Elevation is expressed through **deep, very soft, low-opacity shadows** plus a
**1px ring** (`ring-1 ring-border`) rather than hard borders. Shadows are tuned
to look right on the gradient canvas, so they're large and diffuse.

| Level | Example | Use |
|---|---|---|
| Ring only | `ring-1 ring-border` | Active nav item, default separation |
| Card | `shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]` | Cards |
| Input | `shadow-[0_10px_40px_-30px_rgba(15,23,35,0.16)]` | Text fields |
| Button (default) | `shadow-[0_20px_45px_-30px_rgba(0,0,0,0.45)]`, hover `0_28px_55px_-28px` | Primary buttons |
| Category chip | `shadow-[0_12px_30px_-24px_rgba(0,0,0,0.5)]` | Category badges |
| Popover/Dialog | `shadow-[0_30px_80px_-38px_rgba(17,17,17,0.52)]` | Overlays |
| Tooltip (chart) | `0_28px_80px_-44px_rgba(0,0,0,0.9)` | Recharts tooltip |

Pattern: **large blur, large negative spread, low alpha** → a grounded float, not
a harsh drop shadow. Translucent overlay surfaces add `backdrop-blur`
(`backdrop-blur-sm` overlays, `backdrop-blur-xl/2xl` for dialog/topbar/bottom nav).

### 2.6 Iconography

- **Library:** [`lucide-react`](https://lucide.dev) exclusively.
- **Default sizes:** `h-4 w-4` (16px) inline / nav; `h-3 w-3` in badges;
  `h-6 w-6` in empty-state medallions. Buttons auto-size SVGs to `size-4`
  (`size-3`/`3.5` for `xs`/`sm`).
- **Stroke:** library default; icons inherit `currentColor`.
- **Nav icon set:** Dashboard `LayoutDashboard`, Movements `ArrowUpDown`,
  Budgets `PiggyBank`, Calendar `CalendarDays`, Analytics `BarChart3`,
  Investments `CandlestickChart`, Wisdom `BookOpenText`, Settings `Settings`,
  Log out `LogOut`.
- **Category icons:** mapped from a string key → Lucide component in
  [`category-badge.tsx`](src/components/shared/category-badge.tsx); unknown keys
  fall back to `MoreHorizontal`.

### 2.7 Motion

Driven by **Framer Motion**; `next-themes` runs with `disableTransitionOnChange`
so theme flips don't animate.

| Motion | Spec | Where |
|---|---|---|
| Route / page transition | `opacity 0→1`, `y 8→0` in / `y 0→-8` out, **0.24s**, ease `[0.22, 1, 0.36, 1]` | App layout `AnimatePresence` |
| Card entrance (stagger) | `opacity 0→1`, `y 10→0`, **0.24s**, `delay = index × 0.04s` | Summary cards |
| Button press | `active:translate-y-px`; hover `-translate-y-0.5` | Buttons |
| Hover lift | `hover:-translate-y-0.5` + shadow grow | Primary buttons |
| Transitions (general) | `transition-all`/`-colors`, **150–200ms** | Nav, links, fills |
| Skeleton / loading | `animate-pulse` on `bg-muted` | Skeletons, chart placeholder |

**Standard easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (a gentle ease-out) for
entrances. Keep durations ≤ 240ms. Respect reduced-motion (prefer adding
`prefers-reduced-motion` guards to any new non-essential motion).

---

## 3. Components

All primitives live in [`src/components/ui/`](src/components/ui), are built on
**Base UI** (`@base-ui/react`) with the shadcn **`base-nova`** style, and use
`cva` for variants. Compose with `cn()` (clsx + tailwind-merge) from
[`utils.ts`](src/lib/utils.ts). Every primitive exposes a `data-slot` for styling
hooks and tests.

### 3.1 Button — [`button.tsx`](src/components/ui/button.tsx)

**Variants:** `default` (solid primary, lift + shadow on hover) · `outline`
(secondary fill, hairline border) · `secondary` (filled secondary) · `ghost`
(transparent, fills on hover) · `destructive` (tinted `destructive/10` fill,
not solid red) · `link` (underline on hover).

**Sizes:** `default` (h-9) · `xs` (h-6) · `sm` (h-8) · `lg` (h-9, wider) ·
`icon` (size-8) · `icon-xs` (size-6) · `icon-sm` (size-7) · `icon-lg` (size-9).

**States:** focus-visible → `border-ring` + `ring-3 ring-ring/30`; disabled →
`opacity-50`, no pointer events; `aria-invalid` → destructive border + ring;
active → 1px downward nudge (suppressed for menu triggers).

Base shape: `rounded-xl`, `font-medium`, `text-sm`. Use `default` for the single
primary action per view; `outline`/`ghost` for secondary and toolbar actions;
`destructive` only for irreversible/removal actions.

### 3.2 Card — [`card.tsx`](src/components/ui/card.tsx)

The primary container. Parts: `Card`, `CardHeader`, `CardTitle`,
`CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

- Shape: `rounded-[calc(var(--radius)*1.35)]`, `bg-card/96`,
  `ring-1 ring-border`, deep soft shadow, `overflow-hidden`.
- Density: `size="default"` (gap-4, py-4) or `size="sm"` (gap-3, py-3); content
  padding tracks the size (`px-4` / `px-3`).
- `CardTitle` uses `font-heading` semibold; `CardDescription` is
  `text-muted-foreground`.
- `CardFooter` gets a top border + `bg-secondary/55` and flush bottom corners.
- `CardAction` parks an action in the top-right of the header grid.

### 3.3 Badge — [`badge.tsx`](src/components/ui/badge.tsx)

Pill (`rounded-4xl`, `h-5`, `text-xs`, `font-medium`). Variants: `default`,
`secondary`, `destructive` (tinted), `outline`, `ghost`, `link`. Built with Base
UI `useRender` so it can render as `<span>` or polymorphically (e.g. a link).
Supports leading/trailing icon slots via `data-[icon=...]`.

For category identity, prefer the dedicated **CategoryBadge** (§4.3), not this
primitive.

### 3.4 Input & form controls

- **Input** [`input.tsx`](src/components/ui/input.tsx): `h-10`, `rounded-xl`,
  translucent `bg-background/78` (dark `input/30`), faint inner shadow,
  `text-base` (→`md:text-sm` to avoid iOS zoom). Focus → `border-ring` +
  `ring-3 ring-ring/24`; `aria-invalid` → destructive border + ring; disabled →
  reduced opacity + `not-allowed`.
- **Label** [`label.tsx`], **Textarea** [`textarea.tsx`], **Select**
  [`select.tsx`], **Switch** [`switch.tsx`], **InputGroup** [`input-group.tsx`]
  follow the same radius/border/focus language.
- Forms use **react-hook-form** + **zod** (`@hookform/resolvers`). Decimal input
  is normalized via `normalizeDecimalInput` / `parseDecimalInput`
  ([`utils.ts`](src/lib/utils.ts)) to accept both `1.234,56` and `1,234.56`.

### 3.5 Overlays

- **Dialog** [`dialog.tsx`](src/components/ui/dialog.tsx): centered popup,
  `rounded-[1.6rem]`, `bg-popover/98` + `backdrop-blur-xl`, `ring-1 ring-border`,
  `max-w-sm` default; backdrop `bg-black/14` + `backdrop-blur-sm`; open/close
  animate with `fade` + `zoom-95`. Header (`gap-2.5`), Footer (bordered,
  `bg-muted/50`, reverses to row on `sm`), auto close button (top-right ghost
  `icon-sm`).
- **Sheet** [`sheet.tsx`]: side drawer — used for the mobile nav (`side="left"`,
  `w-[240px]`).
- **Popover** [`popover.tsx`], **Dropdown Menu** [`dropdown-menu.tsx`],
  **Tooltip** [`tooltip.tsx`], **Command** [`command.tsx`] (cmdk) for the command
  palette. All share popover surface + ring + soft shadow.

### 3.6 Navigation primitives

- **Tabs** [`tabs.tsx`](src/components/ui/tabs.tsx): `default` (filled track,
  `bg-muted`, active item raised with `bg-background` + shadow) and `line`
  (underline indicator via `::after`). Supports horizontal/vertical.
- **Separator** [`separator.tsx`].

### 3.7 Data display

- **Table** [`table.tsx`](src/components/ui/table.tsx): wrapped in an
  overflow-x container; `text-sm`; header cells `h-10` `font-medium`; rows get
  bottom border + `hover:bg-muted/50` + `data-[state=selected]:bg-muted`;
  footer `bg-muted/50`.
- **Progress** [`progress.tsx`](src/components/ui/progress.tsx): `h-1` track
  (`bg-muted`, rounded-full) + `bg-primary` indicator; optional label/value
  (value is `tabular-nums`). Used for budget-envelope fill.
- **Avatar** [`avatar.tsx`], **Calendar** [`calendar.tsx`] (react-day-picker),
  **Skeleton** [`skeleton.tsx`] (`animate-pulse` + `bg-muted`).

### 3.8 Feedback

- **Toaster / Sonner** [`sonner.tsx`](src/components/ui/sonner.tsx): global toast
  host mounted once in the root layout. Use for async success/error
  confirmations.

---

## 4. Composite Patterns

### 4.1 Page header — [`page-header.tsx`](src/components/layout/page-header.tsx)

Every page opens with `<PageHeader title description>{actions}</PageHeader>`:
big tracked-tight H1, optional muted description (lg+ only), and a right-aligned,
wrapping actions slot (commonly a `MonthPicker`). Pages then stack content in a
`space-y-8` column.

### 4.2 KPI / summary card — [`summary-cards.tsx`](src/components/dashboard/summary-cards.tsx)

The hallmark metric block:
- Uppercase wide-tracked **eyebrow label** (`tracking-[0.28em]
  text-muted-foreground`).
- **Hero value** in `font-heading` `2.15rem` `tracking-[-0.045em]`.
- A circular icon medallion (`h-10 w-10 rounded-full bg-secondary`); turns
  emerald-tinted when the metric is positive.
- A muted detail line + a **delta badge** (outline pill) — emerald with
  `ArrowDownRight` for good, destructive with `ArrowUpRight` for bad.
- Cards fade/stagger in (`delay = index × 0.04s`).
- Grid: `grid gap-4 md:grid-cols-2 xl:grid-cols-3`.

### 4.3 Category badge / icon — [`category-badge.tsx`](src/components/shared/category-badge.tsx)

- `CategoryBadge`: pill with category icon + name, tinted from the category hex
  (`color15` fill / `color24` border / `color` text), soft shadow. Sizes
  `sm`/`md`.
- `CategoryIcon`: standalone `h-8 w-8 rounded-xl` tinted medallion.

### 4.4 Currency display — [`currency-display.tsx`](src/components/shared/currency-display.tsx)

`<CurrencyDisplay amount currency showOriginal />` renders `font-mono
tabular-nums`, converts to the user's base currency via `CurrencyProvider`, and
can show the original amount in parentheses as muted caption. **All money on
screen should route through this component or `formatCurrency`** so locale,
symbol, and conversion stay consistent.

### 4.5 Empty state — [`empty-state.tsx`](src/components/shared/empty-state.tsx)

Centered, `py-12`: `h-12 w-12 rounded-xl bg-muted` icon medallion → `text-sm
font-medium` title → muted description → optional action. Use for any zero-data
list or filtered-to-empty view.

### 4.6 Month picker / switches

- **MonthPicker** [`month-picker.tsx`]: primary time scope control in page
  headers; drives the `{month, year}` state most pages share.
- **CurrencyQuickSwitch** [`currency-quick-switch.tsx`] and **LanguageSwitch**
  [`language-switch.tsx`]: compact topbar toggles (EN/ES, base currency).

---

## 5. Layout & Navigation

### 5.1 App shell — [`(app)/layout.tsx`](src/app/(app)/layout.tsx)

```
┌───────────────────────────────────────────────┐
│ Sidebar (md+, 268px) │ Topbar (sticky)         │
│                      ├─────────────────────────┤
│  brand               │  main (scroll, animated)│
│  nav items           │   max-w-[1480px]        │
│  ────────            │   p-4 / sm:p-5 / lg:p-8 │
│  log out             │                         │
│                      │  Mobile bottom nav (md-)│
└───────────────────────────────────────────────┘
```

Wrapped in `CurrencyProvider`. Main content is keyed by pathname and animated by
`AnimatePresence` (§2.7).

### 5.2 Sidebar (desktop) — [`sidebar.tsx`](src/components/layout/sidebar.tsx)

`hidden md:flex`, **width `268px`**, right hairline border, `bg-sidebar`. Brand
block on top, nav list (`space-y-1.5`), log-out pinned to the bottom. Items:
`rounded-[1.15rem]`, `px-3.5 py-3`, `text-sm font-medium`; **active** =
`bg-secondary text-foreground ring-1 ring-border`; **idle** =
`text-muted-foreground` → hover `bg-sidebar-accent`.

### 5.3 Topbar — [`topbar.tsx`](src/components/layout/topbar.tsx)

`sticky top-0 z-30`, `bg-background/80` + `backdrop-blur-2xl`, bottom hairline.
Left: mobile menu trigger (Sheet) + compact brand (mobile only) / a wide-tracked
“Monthly ledger” eyebrow (desktop). Right: command palette, language + currency
switches (sm+), and the **theme toggle** (sun/moon cross-fade with rotate+scale).
Control chips are `h-9 w-9 rounded-2xl border bg-secondary/80`.

### 5.4 Mobile navigation — [`mobile-nav.tsx`](src/components/layout/mobile-nav.tsx)

- **Bottom nav** (`md:hidden`): fixed, `h-[4.75rem]`, `z-50`, `bg-background/92`
  + `backdrop-blur-2xl`, top border. Four primary destinations (Dashboard,
  Movements, Budgets, Analytics) as equal-width tiles with `9px` labels; active
  tile gets `bg-secondary ring-1 ring-border`. Main content reserves space with
  `pb-20 md:pb-0`.
- **Sheet drawer** (`MobileNavContent`): full nav list + switches + log out,
  opened from the topbar menu button.

> Mental model: **desktop = persistent sidebar (full nav)**, **mobile = bottom
> nav (top 4) + drawer (everything)**.

### 5.5 Auth layout — [`(auth)/layout.tsx`](src/app/(auth)/layout.tsx)

Centered single column, `max-w-[400px]`, plain `bg-background`, language switch
pinned top-right. Auth forms ([`login-form.tsx`], [`signup-form.tsx`]) are a
single `Card` with a centered icon, title, description, fields, inline error,
and a loading spinner (`Loader2`) on submit.

---

## 6. Data Visualization

Built on **Recharts**, themed to the token system so charts re-skin with
light/dark automatically (see [`spending-chart.tsx`](src/components/dashboard/spending-chart.tsx)).

**Conventions**
- **Series color:** `var(--chart-1)` line/area; line `strokeWidth ≈ 2.35`.
- **Area fill:** vertical gradient of `--chart-1`, `opacity 0.34 → 0.02`.
- **Grid:** horizontal only, dashed `strokeDasharray="2 5"`, `stroke="var(--border)"`,
  no vertical lines, axis lines/ticks hidden.
- **Axis ticks:** `fontSize 10`, `fill var(--muted-foreground)`; Y axis uses
  `Intl.NumberFormat` compact currency.
- **Tooltip:** `bg var(--popover)`, `1px var(--border)`, `border-radius 18px`,
  `font-mono`, big soft shadow; values formatted as currency in the active
  locale.
- **Mounting:** charts render only after `mounted` (client) to avoid SSR layout
  thrash; show an `animate-pulse` placeholder meanwhile.
- **Formatting:** always use the app's `Intl` locale (`intlLocale`) + base
  currency for axis/tooltip numbers.

Mobile dashboards swap dense charts for the stacked
[`mobile-dashboard-overview.tsx`](src/components/dashboard/mobile-dashboard-overview.tsx).

---

## 7. Internationalization & Formatting

- **Languages:** English + Spanish, via `LocaleProvider` and a `t(en, es)`
  helper (`useLocale`). Every user-facing string must supply both.
- **Locale resolution** ([`utils.ts`](src/lib/utils.ts)): `en` → `en-US`,
  `es` → `es-ES`; dates via `date-fns` locales (`enUS`/`es`).
- **Currency:** base currency selectable from 20 currencies
  ([`constants.ts`](src/lib/constants.ts), default **EUR**); amounts convert
  through `CurrencyProvider` and format via `formatCurrency` (2 fraction digits,
  locale-aware). Category data carries its own currency and is converted to base
  for display.
- **Numbers:** decimal input accepts both EU and US groupings; output uses the
  locale's grouping/decimal marks.
- **Layout tolerance:** never truncate-critical or fixed-width labels that break
  under Spanish's longer strings; mobile nav uses `truncate` deliberately.

---

## 8. Accessibility

Targets WCAG 2.1 AA.

- **Focus:** all interactive primitives show a visible focus ring
  (`focus-visible:ring-3 ring-ring/30` or `ring-[3px] ring-ring/50`). Never
  remove without an equivalent.
- **Labels:** icon-only controls carry `sr-only` text (theme toggle, menu, dialog
  close, sheet title). Continue this for any new icon button.
- **Semantics:** real `<header>`, `<nav>`, `<main>`, `<aside>`, `<table>`
  elements; Base UI primitives provide ARIA roles/states.
- **Invalid state:** `aria-invalid` drives destructive border + ring on inputs
  and buttons — wire validation to it rather than ad-hoc styling.
- **Color independence:** positive/negative states pair color with a directional
  icon (`ArrowUpRight`/`ArrowDownRight`) and text, never color alone.
- **Contrast:** keep text at `foreground`/`muted-foreground`; don't introduce
  lighter grays for readable text. Verify category-tinted text (raw hex) against
  its tinted background per theme.
- **Targets:** interactive controls are ≥ 32px (`h-8`+) tall; mobile nav tiles
  fill the `4.75rem` bar height.
- **Motion:** add `prefers-reduced-motion` fallbacks for any new non-essential
  animation; theme changes already skip transitions.

---

## 9. Theming & Token Governance

- **Mechanism:** `class="dark"` toggled by `next-themes`
  (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`,
  `disableTransitionOnChange`) in [`theme-provider.tsx`](src/providers/theme-provider.tsx).
  The `dark` Tailwind variant is `@custom-variant dark (&:is(.dark *))`.
- **Definition:** raw values on `:root` / `.dark`; Tailwind utilities mapped in
  `@theme inline`. **Both themes must define every token.**
- **Brand / PWA:** app/theme color `#2d3135`; PWA `display: standalone`, icons
  192/512 ([`manifest.ts`](src/app/manifest.ts)); brand mark in
  [`site-brand.tsx`](src/components/layout/site-brand.tsx) (rounded image tile +
  “Stewardship” eyebrow + wordmark). Favicon/apple-icon in `src/app/`.
- **Adding a token:** add to `:root` **and** `.dark`, expose in `@theme inline`,
  then consume by name. Don't hard-code hex in components (except data-driven
  category color).
- **Adding a component:** start from a Base UI primitive + `cva`, mirror the
  radius/border/ring/shadow/focus language above, add a `data-slot`, and keep
  EN/ES strings.

---

## 10. Content & Voice

- **Tone:** warm, plain-spoken stewardship language — e.g. “Review the month
  across spending, envelopes, and steady stewardship cues.” Avoid jargon and
  hype.
- **Domain vocabulary:** *stewardship, ledger, envelopes/budget pool, giving,
  tithe, wisdom*. The brand kicker is **“Stewardship / Mayordomía.”**
- **Eyebrows:** short, uppercase, scannable (“Monthly ledger”, “Cash flow”,
  “Spent this month”).
- **Numbers:** always formatted (currency/locale), never raw.
- **Bilingual parity:** EN and ES copy should match in tone and length intent,
  not be literal word-for-word when that reads awkwardly.

---

## 11. Quick Reference (cheat sheet)

| Need | Use |
|---|---|
| Surface / panel | `Card` (`rounded-[calc(var(--radius)*1.35)]`, `ring-1 ring-border`, `bg-card/96`) |
| Section/metric label | uppercase eyebrow `text-[0.72rem] tracking-[0.28em] text-muted-foreground` |
| Big number | `font-heading text-[2.15rem] tracking-[-0.045em]` |
| Money | `CurrencyDisplay` / `formatCurrency`, `font-mono tabular-nums` |
| Primary action | `<Button>` (default) |
| Secondary / toolbar action | `<Button variant="outline" | "ghost">` |
| Destructive action | `<Button variant="destructive">` |
| Positive state | emerald (`text-emerald-300`, `bg-emerald-500/10`) + down-arrow |
| Negative state | `destructive` token + up-arrow |
| Category tag | `CategoryBadge` (hex `+15` fill / `+24` border) |
| Zero data | `EmptyState` |
| Async result | Sonner toast |
| Chart series | `var(--chart-1)`, dashed horizontal grid, popover tooltip |
| Page scaffold | `PageHeader` + `space-y-8` column inside `max-w-[1480px]` |
| New string | `t("English", "Español")` |

---

*Maintained alongside the codebase. Update this file in the same change as any
modification to tokens (`globals.css`), shared primitives (`components/ui`), or
layout chrome (`components/layout`).*
