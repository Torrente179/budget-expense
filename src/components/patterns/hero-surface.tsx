/**
 * Month-summary hero chrome — the premium black card shared by Home and
 * Budget. Deliberately dark in **both** themes: the black surface is the
 * statement, the way a metal card reads the same on any table.
 *
 * Anything placed on it is white-on-black, so use the tokens below instead of
 * ad-hoc `white/xx` values — that keeps the two heroes in lockstep.
 */

/**
 * The card itself: graphite → black gradient, hairline edge, lifted.
 * Dark mode raises the floor a step so the card still reads as a card on the
 * app's near-black page instead of dissolving into it.
 */
export const HERO_SURFACE =
  "relative overflow-hidden rounded-2xl text-white shadow-2 ring-1 ring-white/10 bg-[linear-gradient(158deg,#1c1e24_0%,#101216_46%,#08090b_100%)] dark:bg-[linear-gradient(158deg,#24272e_0%,#181b20_46%,#111318_100%)]";

/** Raised tile inside the hero (daily guide, pace status). */
export const HERO_TILE = "bg-white/[0.06] ring-1 ring-white/10";

/** Small square behind an icon. */
export const HERO_ICON_TILE = "bg-white/[0.08]";

/** Hairline rule between hero sections. */
export const HERO_RULE = "border-white/10";

/** Track behind any progress bar or ring. */
export const HERO_TRACK = "bg-white/10";

/** Mint used for income / healthy states — the app's dark-mode income green. */
export const HERO_ACCENT = "#34D399";

/**
 * Light catching the top edge plus a soft corner bloom. Drop it as the first
 * child of a `HERO_SURFACE` section, before the content.
 */
export function HeroSheen() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/[0.07] blur-3xl"
      />
    </>
  );
}
