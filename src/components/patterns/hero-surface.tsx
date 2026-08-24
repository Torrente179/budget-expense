/**
 * Up's chrome surface — the near-black band that carries the one big coral
 * figure. Shared by Home, Budget and Patrimonio.
 *
 * Up is flat. There is no gradient, no sheen, no ring and no lift: the surface
 * is a single ink colour, and separation comes from its contrast against the
 * white sheet below it. Anything placed on it is white-on-ink, so use the
 * tokens below rather than ad-hoc `white/xx` values.
 *
 * There is only one appearance, so this does not vary by theme.
 */

/**
 * The chrome band itself: flat ink.
 *
 * Full-bleed and square-cornered on mobile so it continues the rail's ink
 * surface edge to edge, the way Up's hero sits directly under its tab rail.
 * On desktop, where the sidebar carries the chrome instead, it goes back to
 * being a rounded card inside the content column.
 */
export const HERO_SURFACE =
  "relative overflow-hidden bg-ink text-white -mx-4 rounded-none sm:-mx-5 md:mx-0 md:rounded-xl";

/** Raised tile inside the chrome (daily guide, pace status). */
export const HERO_TILE = "bg-white/[0.07]";

/** Small square behind an icon. */
export const HERO_ICON_TILE = "bg-white/[0.09]";

/** Hairline rule between chrome sections. */
export const HERO_RULE = "border-white/10";

/** Track behind any progress bar or ring on the chrome. */
export const HERO_TRACK = "bg-white/12";

/** Up's mint — inflows, healthy states, "change in savers". */
export const HERO_ACCENT = "#3DDC97";

/**
 * Up's red, for a genuinely bad state: over a tracker's limit, net worth
 * falling. Deliberately NOT coral — coral is the primary and the money colour
 * here, so using it for "bad" would make every hero read as an alarm.
 */
export const HERO_ACCENT_NEGATIVE = "#F65B50";

/** Amber for "watch this", short of bad. */
export const HERO_ACCENT_WARNING = "#F5A623";
