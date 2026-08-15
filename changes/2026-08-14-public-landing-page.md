# A public landing page at `/`

## Summary

Builds direction **D · Tour** from
[`2026-08-14-landing-page-mockups.md`](2026-08-14-landing-page-mockups.md),
chosen by the owner out of the four.

Before this, `/` redirected to `/home` unconditionally and
[`src/lib/supabase/middleware.ts`](../src/lib/supabase/middleware.ts) bounced
every signed-out request to `/login` — so the first thing a stranger ever saw
was a password field for a product that had not introduced itself. `/` is now a
public product tour that ends at **Create account** and **Log in**.

Signed-in visitors are unaffected: they are redirected from `/` to `/home`,
exactly as before.

## Product Changes

**The page** —
[`src/components/landing/landing-page.tsx`](../src/components/landing/landing-page.tsx).
A short hero carrying the desktop app, a sticky section rail, then one section
per primary section — Home, Budget, Patrimonio, Insights — each pairing that
section's real screen with a plain statement of what it does and three
specifics. Grounds alternate white / ink / white / lemon, closing on a coral
band. The hero is deliberately small: in this direction the tour is the
argument.

Copy is bilingual through `t(en, es)` like the rest of the app, and reuses the
product's existing voice — the `Money, clearly / Tu dinero, claro` kicker from
[`auth-story.tsx`](../src/components/auth/auth-story.tsx) — and the section
definitions from [`design.md`](../design.md) §1, so nothing on it claims a
feature the app does not have. No traction numbers, user counts or
testimonials: there is nothing true to put there yet.

**The screenshots are the real components.** Wherever the app has a component
free of viewport breakpoints, the frames render *that component*, not a copy:
`HomeActivitySheet` for the feed, `TransactionRow` for every row,
`BudgetTrackerCard` for the trackers, `CategoryGlyph` for the glyphs,
`SPEND_CHART_COLOR` for the Insights series, `PRIMARY_NAV`/`SECONDARY_NAV` for
every nav label in the desktop frame. When those change, the landing page
changes with them. This is the same discipline as the
[feed rebuild](2026-08-14-up-feed-rebuild.md), which recorded that verifying
against hand-written markup is how the previous pass fooled itself.

What is *not* a real component, and why:

- **Screen chrome** — status bar, section rail, the single centred figure
  (`screens/screen-chrome.tsx`). The signed-in versions carry routing, month
  state and `lg:` breakpoints, and Tailwind breakpoints are viewport-based, so
  a real `HomeScreen` inside a 390px frame on a 1440px viewport would render
  its *desktop* layout squeezed to phone width. Nothing inside a frame uses a
  breakpoint variant, so a frame looks identical at every viewport.
- **The Insights bars** — plain elements rather than Recharts. A screenshot is
  never interactive and the real chart animates on mount; the series colour is
  imported so it cannot drift.
- **The Patrimonio buckets** — laid out here, but coloured from
  `WEALTH_ACCENTS`.

**Frames are pictures, not copies.** `PhoneFrame`/`BrowserFrame`
([`device-frame.tsx`](../src/components/landing/device-frame.tsx)) mark the
subtree `inert` — out of the tab order, pointer events dead — and expose it as
`role="img"` with a localized label describing what the screen shows. The
markup inside carries real links to `/movements/recurring` and friends; without
this a visitor could tab into a screenshot and be bounced to `/login`.

**Sample data** lives in
[`demo-data.ts`](../src/components/landing/demo-data.ts). One tracker is
deliberately over its limit: showing only healthy budgets would misrepresent
what Budget looks like in the month it matters.

**Tokens.** Four utilities added to `globals.css` —
`device-phone` / `device-window` (frames lay their screen out at true device
size and scale it with one transform, so type stays proportionally correct
instead of being re-typeset at marketing sizes) and `landing-display` /
`landing-title` (the app's scale tops out at `text-display`, which is a money
hero, not a page headline). The frames also restate `color: var(--foreground)`,
because they can sit on an ink section and would otherwise inherit its white
text into a white sheet.

## Data Model

None. No schema, query, API or migration change. The page reads no user data —
it calls `auth.getClaims()` once to decide whether to redirect, and renders
fixtures otherwise.

## Validation

- `npx tsc --noEmit` clean · `npx eslint src` 0 errors (11 pre-existing
  warnings, none in the new files) · `npm run build` compiles, `/` builds as a
  dynamic route (it reads the auth cookie).
- Verified signed-out in the browser at 1440px and 375px, in **both** EN and
  ES: nav labels, currency (`€2,847.30` / `2847,30 €`) and tracker copy
  (`€124.00 left` / `quedan 124,00 €`) all resolve, and the layout holds the
  longer Spanish strings.
- `/home` still redirects to `/login` when signed out — only `/` was opened,
  matched exactly (`pathname !== "/"`), since `startsWith("/")` would have
  opened the entire app.

Four defects found and fixed during verification, all of them things that
looked right in the mockup and were wrong in the real system:

1. **`redirect()` inside `try/catch`.** `redirect` signals by throwing, so the
   catch meant to tolerate a missing Supabase config would have swallowed it and
   served the landing page to a signed-in user. It now runs outside the block.
2. **Invisible buttons.** `buttonVariants({ variant: "outline" })` paints
   `bg-white`; a `bg-transparent` override in the same className is a coin-flip
   against it in the generated stylesheet, and lost — white text on a white
   pill. Same for `bg-ink` against `bg-primary` on the coral band. The
   secondary and ink-on-coral actions are now explicit pills with the shared
   geometry and no competing background.
3. **White text bleeding into the frames.** `up-chrome` sets `color: #fff`, so
   a frame on an ink section inherited white into its white sheet — the desktop
   "Where it went" rows were white on white.
4. **Header overflowed 375px**, pushing *Create account* off-screen. The
   wordmark and language chip now drop out below `sm`; both account buttons
   stay.

## Known gaps

- **A pre-existing hydration mismatch now shows on a public page.** React logs
  `Hydration failed because the server rendered text…` on `/` — and identically
  on `/login`, with and without a locale cookie, so it is not introduced here.
  It comes from `LocaleProvider` re-resolving the locale in an effect
  (`locale-provider.tsx:130`, which eslint already flags as
  `react-hooks/set-state-in-effect`). Worth fixing on its own, since it now
  costs a client re-render on the first page a stranger loads.
- **`<title>` and `description` are English-only.** Metadata is resolved on the
  server before the locale provider mounts; the description embeds both
  languages, as the root layout's already does.
- No `og:image`. The page has no share card yet.
