/**
 * The hero band that opens Movements, Recurring and Patrimonio, carrying one
 * large figure.
 *
 * On a phone it is flush with the page ground and runs edge to edge, so the
 * figure sits directly under the header with no box around it. On desktop,
 * where a bare figure would float in a wide column, it becomes a card.
 * Everything on it resolves through the theme tokens below, so it reads the
 * same in the light and the dark appearance. Do not use `white/xx` or hex
 * values on it.
 */

export const HERO_SURFACE =
  "relative overflow-hidden bg-background text-foreground -mx-4 rounded-none sm:-mx-5 md:mx-0 md:rounded-2xl md:bg-card md:ring-1 md:ring-inset md:ring-border";

/** Raised tile inside the chrome (daily guide, pace status). */
export const HERO_TILE = "bg-foreground/[0.07]";

/** Small square behind an icon. */
export const HERO_ICON_TILE = "bg-foreground/[0.09]";

/** Hairline rule between chrome sections. */
export const HERO_RULE = "border-border";

/** Track behind any progress bar or ring on the chrome. */
export const HERO_TRACK = "bg-foreground/12";

/** Mint — inflows, healthy states, "change in savers". */
export const HERO_ACCENT = "var(--income)";

/**
 * Red, for a genuinely bad state: over a tracker's limit, net worth falling.
 * Deliberately NOT coral — coral is the accent here, so using it for "bad"
 * would make every hero read as an alarm.
 */
export const HERO_ACCENT_NEGATIVE = "var(--danger)";

/** Amber for "watch this", short of bad. */
export const HERO_ACCENT_WARNING = "var(--warning)";
