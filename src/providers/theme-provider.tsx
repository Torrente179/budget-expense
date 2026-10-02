"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { THEME_COOKIE_KEY, type ThemePreference } from "@/lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Holds the appearance preference. The server renders `data-theme` on `<html>`
 * from the cookie and the stylesheet does the rest, including following the
 * device for "system", so there is nothing to resolve before first paint.
 */
export function ThemeProvider({
  initialPreference,
  children,
}: {
  initialPreference: ThemePreference;
  children: ReactNode;
}) {
  const router = useRouter();
  const [preference, setPreferenceState] = useState(initialPreference);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      // Repaint at once; the refresh then re-renders `<html data-theme>` and
      // the theme-color meta from the cookie, so the server stays the source.
      document.documentElement.dataset.theme = next;
      document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemePreference must be used inside ThemeProvider");
  }
  return context;
}
