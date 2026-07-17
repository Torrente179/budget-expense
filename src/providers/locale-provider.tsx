"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type AppLocale, getIntlLocale, resolveAppLocale } from "@/lib/utils";
import { translateCategoryName } from "@/lib/constants";

const LOCALE_STORAGE_KEY = "be-locale";
const LOCALE_COOKIE_KEY = "be_locale";

interface LocaleContextValue {
  locale: AppLocale;
  intlLocale: string;
  setLocale: (locale: AppLocale) => void;
  t: (english: string, spanish: string) => string;
  /** Translate a category name to the active locale, including legacy aliases. */
  tc: (name: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCookieLocale() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePair = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${LOCALE_COOKIE_KEY}=`));

  if (!cookiePair) {
    return null;
  }

  return cookiePair.split("=")[1] ?? null;
}

function readInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieLocale = readCookieLocale();
    const browserLocale =
      window.navigator.languages?.[0] ?? window.navigator.language;
    return resolveAppLocale(stored ?? cookieLocale ?? browserLocale);
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(readInitialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Re-resolve after mount in case SSR defaulted to English.
    const nextLocale = readInitialLocale();
    setLocaleState(nextLocale);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, hydrated]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(resolveAppLocale(nextLocale));
  }, []);

  const t = useCallback(
    (english: string, spanish: string) => (locale === "es" ? spanish : english),
    [locale]
  );

  const tc = useCallback(
    (name: string) => translateCategoryName(name, locale),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      intlLocale: getIntlLocale(locale),
      setLocale,
      t,
      tc,
    }),
    [locale, setLocale, t, tc]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}
