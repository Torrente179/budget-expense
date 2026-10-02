/** The appearance the person asked for. "system" follows the device. */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_COOKIE_KEY = "be_theme";

/** Dark is the default appearance until someone chooses otherwise. */
export const DEFAULT_THEME: ThemePreference = "dark";

/** Page-ground colours, for the browser's `theme-color`. */
export const THEME_GROUND = { light: "#f3f5f8", dark: "#0d0b0a" } as const;

export function resolveThemePreference(
  value: string | null | undefined
): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_THEME;
}
