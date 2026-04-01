# 2026-04-01 — Initial Build

## Foundation & Setup
- Scaffolded Next.js 15 App Router project with TypeScript, Tailwind CSS v4, ESLint
- Installed and configured shadcn/ui (New York style, Zinc base) with 20+ components
- Installed core dependencies: Supabase SSR, Framer Motion, Recharts, Zod v4, react-hook-form, date-fns, next-themes, lucide-react
- Set up Supabase client (browser), server client, and middleware session refresh
- Created `src/lib/supabase/env.ts` for flexible env var resolution across hosting providers
- Created utility helpers: `cn`, `formatDate`, `formatCurrency` in `src/lib/utils.ts`

## Database Schema (`supabase/migration.sql`)
- Created tables: `profiles`, `categories`, `expenses`, `budgets`
- Added trigger to auto-create profile on user signup
- Added trigger to auto-update `updated_at` timestamps
- Created `monthly_expense_summary` view for aggregated reporting
- Added indexes on user_id, date, category, year+month
- Enabled Row Level Security (RLS) on all tables
- Seeded 12 default categories (Food, Transport, Housing, Utilities, Entertainment, Shopping, Healthcare, Education, Travel, Subscriptions, Groceries, Other)

## Auth (Phase 3)
- Built login and signup pages with form validation
- Email/password authentication via Supabase Auth
- Middleware-based session refresh and route protection
- Auth callback route for email confirmation
- Redirects: unauthenticated users to /login, authenticated users away from /login and /signup

## App Shell & Layout (Phase 4)
- "Glass Console" design system: dark-mode-first, indigo accent (#818cf8), Geist fonts
- Desktop sidebar navigation (Dashboard, Expenses, Budgets, Settings)
- Mobile bottom tab bar navigation
- Responsive topbar with currency quick-switch
- Framer Motion `AnimatePresence` page transitions
- Theme toggle (dark/light) via next-themes

## Currency System (Phase 5)
- Server-side proxy to frankfurter.app API with 1-hour in-memory cache (`/api/exchange-rates`)
- `CurrencyProvider` context: stores base currency, exchange rates, provides `convert()` function
- USD as intermediary for all cross-currency conversions
- Expenses store original currency — conversion is display-only
- Currency quick-switch component in topbar

## Expenses (Phase 6)
- Full CRUD: add, edit, delete expenses
- Expense form dialog with category selector, amount, currency, date, description
- Desktop table view + mobile card layout with Framer Motion stagger animations
- Month picker filter
- Delete confirmation dialog
- Zod v4 validation schema

## Budgets (Phase 7)
- Full CRUD: add, edit, delete budgets per category per month
- Budget cards with animated progress bars (green/yellow/red based on spend %)
- Month picker navigation
- "Copy from Previous Month" feature
- Budget form dialog

## Dashboard (Phase 8)
- Summary cards: Total Spent, Budget Remaining, Savings Rate, Top Category (with animated numbers)
- Recharts AreaChart: daily cumulative spending for current month
- Recharts PieChart (donut): category breakdown with legend
- Recent expenses list (last 5)

## Settings (Phase 9)
- Profile section: display name, avatar URL
- Currency selector: searchable dropdown to change base currency
- Theme toggle
- Danger zone: delete account

## Deployment Fixes
- Downgraded from Next.js 16 to Next.js 15 for Vercel compatibility (proxy.ts not supported)
- Reverted from `proxy.ts` to `middleware.ts` for session handling
- Made middleware resilient to missing Supabase env vars (graceful passthrough)
- Fixed ESLint config for Next.js 15 flat config format
- Added support for multiple Supabase env var names (NEXT_PUBLIC_*, SUPABASE_*)

## Bug Fixes
- Fixed `asChild` prop errors: migrated to `render` prop for @base-ui/react (shadcn/ui v4)
- Fixed Supabase type errors: added `Relationships` arrays to all table types for supabase-js v2.101+
- Fixed Zod v4 coerce incompatibility: used `z.output<>` instead of `z.infer<>`, cast resolver as `any`
- Fixed Select `onValueChange` null handling for @base-ui/react
- Fixed Recharts Tooltip formatter type mismatch
- Fixed hook parameter types: explicit form value types instead of Database Insert types
