# Ground-up UI/UX rework: five-section IA, token system, native-app mobile

## Summary

Complete presentation-layer rework of the app. The previous organic growth had
left 16 routes behind 5 divergent navigation menus, a Dashboard/Analytics
overlap (5 shared components, duplicate fetches), two competing add-expense
forms, ~2,400 lines of dead/orphaned pages, and ~200 ad-hoc color utilities.
This change restructures the app into five core sections (Home · Movements ·
Budget · Wealth · Insights), rebuilds the design system as a strict token
system, unifies capture, and makes mobile feel like a native app. No backend,
schema, or API changes; all features preserved (multi-currency, EN/ES,
imports, review ritual, recurring, investments, tithe tracking).

## Product Changes

- **New IA (old routes are permanent redirect stubs):**
  - `/home` (was `/dashboard`): safe-to-spend hero + sparkline, month stat row
    (Spent, Income, Giving vs target, Budget used), attention feed (review
    queue, anomalies, bills due in 7 days), recent movements, quick actions.
  - `/movements` (was `/movimientos`, absorbs `/expenses` + `/incomes`):
    unified ledger with URL-synced All/Expenses/Income tabs, search, month
    totals, swipe-delete + undo, pull-to-refresh, tap-to-edit sheets. New
    `/movements/recurring` management screen (previously orphaned code).
  - `/budget` (was `/budgets`): Giving pillar card first (stewardship
    integration), income-pool plan, custom budgets, method selector.
  - `/wealth` (was `/investments`): new overview (net worth hero, allocation
    bar, runway, FX exposure) + `/wealth/investments`, `/wealth/savings`, and
    new `/wealth/liabilities` (moved out of Settings).
  - `/insights` (was `/analytics`, absorbs `/calendar`): ratios, 12-month
    trend, three-pillar rates, category breakdown + drilldown
    (`/insights/categories/[id]`), envelope utilization, anomalies, monthly
    report, giving insights, income sources, rebuilt `/insights/calendar`.
  - `/available-now` deleted (dead, zero references).
- **One navigation source** (`src/lib/navigation.ts`) drives the desktop
  sidebar, mobile 5-tab bottom bar (new), mobile profile bottom sheet (new,
  replaces the hamburger drawer), and ⌘K command menu. Review badge from one
  hook everywhere. Regex-based active states highlight sub-routes.
- **Unified capture** (`components/capture/` + `hooks/use-capture.ts`):
  one Expense|Income sheet for create and edit, amount-first with category
  suggestions, optimistic add with Undo. Replaces QuickAddSheet, ExpenseForm,
  and IncomeForm.
- **Design tokens** (`globals.css`): semantic status colors
  (success/warning/danger/info + subtle/foreground, positive/negative for
  amounts), tokenized type scale (display→label + `label-caps` utility),
   3-step theme-aware elevation, canonical Card, centralized Recharts theming.
  Removed the `zoom: 90%` hack and the unused Instrument Serif font; fixed
  PWA/viewport theme colors; added `prefers-reduced-motion` support.
- **Mobile native feel:** per-screen sticky headers (large title, back
  chevron or avatar), bottom sheets with drag handles + safe areas for all
  forms, full-bleed lists, snap-scrolling stat rows, opacity-only route
  transitions.
- **Month selection persists across sections** via new `MonthProvider`.
- Deleted dead code: old dashboard/analytics components, expense/income
  tables+filters+forms, ledger pages, mobile nav/drawer/palette, page-header,
  quick-add files, investment dashboard snapshot (~4,000 lines net removed).

## Validation

- `npm run build` clean (46 routes); `npm run lint` 0 errors (18 pre-existing
  warnings in untouched hooks/providers).
- Gate greps pass: zero raw status-color utilities; zero magic
  radius/text/tracking/shadow values outside `components/ui/`; old route
  strings only in redirect stubs.
- Browser verification (desktop + 375px, dark + light, EN/ES, EUR/COP):
  every screen previewed, redirects checked, CRUD smoke test (add/edit/delete
  expense + income with undo), review badge, import surfaces, month
  persistence across sections — see session notes.
- `design.md` superseded in place to document the new system.
