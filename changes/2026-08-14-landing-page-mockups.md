# Landing page — four directions

## Summary

Mockups only. No application code, route, schema or config behaviour changed —
this is a design decision to make, not an implementation.

Today a signed-out visitor hits `/`, [`src/app/page.tsx`](../src/app/page.tsx)
redirects to `/home`, and
[`src/lib/supabase/middleware.ts:40`](../src/lib/supabase/middleware.ts) bounces
every unauthenticated request that is not `/login`, `/signup`, `/auth` or `/api`
straight to `/login`. The product never gets to introduce itself. These four
directions are candidates for a public front door that does, each ending at the
same two doors: **Create account** and **Log in**.

Files live in [`mockups/landing/`](../mockups/landing/), following the
convention set by [`mockups/up-true/`](../mockups/up-true/).

| | Direction | Anatomy |
|---|---|---|
| **A** | [Ink](../mockups/landing/a-ink.html) | The app's own surface model as the page: near-black hero, one centred coral figure, three phones on a glow, then a white sheet that slides over the fold carrying the five sections as rows. Most on-brand. |
| **B** | [Split](../mockups/landing/b-split.html) | Conversion first. Coral field, copy left, and the account form *on the page* — email, password, Google, "already have an account? Log in". Screens follow immediately below, staggered. Fewest clicks to signed in. |
| **C** | [Bento](../mockups/landing/c-bento.html) | A light 12-column grid of tiles, each carrying one real screen or one real number. Most product visible in the least scrolling. |
| **D** | [Tour](../mockups/landing/d-tour.html) | A long scroll walking Home → Budget → Patrimonio → Insights, one screen each, grounds alternating white / ink / lemon, sticky rail tracking progress. Most explanation per pixel. |

All four are built from the system the app already uses per
[`design.md`](../design.md): coral as both action and money colour, ink chrome
over white sheets, lemon accent, Inter, flat surfaces, pill buttons, the real
`public/icons/budget-expense-app-icon.png` mark. **They differ in anatomy, not
paint**, so the choice is structural rather than chromatic.

## Product Changes

None shipped. What the mockups assume, for whoever implements the chosen one:

- A **public `/` route**. The proxy's unauthenticated branch would need `/` (and
  any landing assets) added alongside `/login` / `/signup` / `/auth` / `/api`,
  and `src/app/page.tsx` would stop being an unconditional redirect — signed-in
  visitors still go to `/home`, signed-out ones get the landing page.
- Copy is a first pass. It reuses the product's existing voice — the
  `Money, clearly / Tu dinero, claro` kicker and `Own your next move.` headline
  already in [`auth-story.tsx`](../src/components/auth/auth-story.tsx) — and the
  section definitions from `design.md` §1, so nothing claims a feature the app
  does not have. Only English is written; shipping means `t(en, es)` throughout.
- No traction, user counts or testimonials appear anywhere. There is nothing
  true to put there yet, and inventing it is not on the table.

### Screenshots

Every app screen is behind auth, so the device frames are the app's real
anatomy **rebuilt in markup**, not captures: the Home feed with `MerchantMark`
squares, day separators and feed striping; remaining-first trackers with the
edge-hugging accent bar; the five Patrimonio buckets in their `WEALTH_ACCENTS`
hues; the magenta `SPEND_CHART_COLOR` Insights bars; and the desktop
sidebar-plus-two-columns layout.

They live in one file,
[`mockups/landing/screens.js`](../mockups/landing/screens.js), so all four
directions show byte-identical screens and only the page around them differs.
Sample figures (€2,847.30 available, €48,120.65 net worth, the merchant rows)
are plausible, not anyone's real ledger.

## Data Model

None. No schema, query, API or migration change.

## Validation

Served from the project root and checked in the browser at 1440px and 390px.

- All four directions plus the gallery render end to end; every `Log in` /
  `Create account` control points at the real `/login` and `/signup`.
- Two defects found and fixed during verification:
  - **Class collision.** The marketing wrapper `.in` (`<div class="wrap in">`)
    also matched `.trk .in` inside the phone screens, so `.b-shots .in { display:
    flex }` turned every tracker's inner box into a flex container and collapsed
    its category glyph to zero width. Renamed the marketing wrapper to `.inner`
    in the CSS and in A, B and D. Worth knowing for anyone extending these: the
    app-screen classes (`.in`, `.row`, `.split`, `.stats`, `.bar`, `.mark`,
    `.day`, `.sec`) are generic, so marketing selectors must not reach into a
    device frame.
  - **Mobile overlap in B.** `.b-shots .inner`'s `-46px` pull, which is the
    intended overlap on desktop, rode the phones up over the account card's fine
    print once the hero stacked. Zeroed under the 1080px breakpoint and replaced
    with section padding.
- The Up tab rail now centres on its active item (`screens.js`) instead of
  clipping arbitrarily, matching the real app and `mockups/up-true/up.js`.
- A `mockups-landing` static-server entry was added to
  [`.claude/launch.json`](../.claude/launch.json) — serving from the project
  root, since the frames reference `public/icons/` for the product mark.

## Open decision

Which direction to build. Nothing here is wired, and none of it should be
propagated into `design.md` until one is chosen — a landing page is not yet part
of the design system.
