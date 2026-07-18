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
import {
  type AppLocale,
  getIntlLocale,
  localeFromDeviceLanguages,
  resolveAppLocale,
} from "@/lib/utils";
import { translateCategoryName } from "@/lib/constants";

const LOCALE_STORAGE_KEY = "be-locale";
const LOCALE_EXPLICIT_KEY = "be-locale-explicit";
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

function hasExplicitLocalePreference() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(LOCALE_EXPLICIT_KEY) === "1";
  } catch {
    return false;
  }
}

function readDeviceLocale(fallback: AppLocale): AppLocale {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const languages =
      window.navigator.languages?.length
        ? window.navigator.languages
        : [window.navigator.language];
    return localeFromDeviceLanguages(languages);
  } catch {
    return fallback;
  }
}

/**
 * Preference order:
 * 1. Explicit user choice (Settings / language toggle)
 * 2. Phone / browser primary language (es → Spanish, else English)
 * 3. Server Accept-Language hint
 */
function readInitialLocale(serverFallback: AppLocale = "en"): AppLocale {
  if (typeof window === "undefined") {
    return serverFallback;
  }

  try {
    if (hasExplicitLocalePreference()) {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      const cookieLocale = readCookieLocale();
      if (stored || cookieLocale) {
        return resolveAppLocale(stored ?? cookieLocale);
      }
    }

    return readDeviceLocale(serverFallback);
  } catch {
    return serverFallback;
  }
}

function persistExplicitLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  window.localStorage.setItem(LOCALE_EXPLICIT_KEY, "1");
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** From Accept-Language on the server — used until the client reads the device. */
  initialLocale?: AppLocale;
}) {
  const serverFallback = resolveAppLocale(initialLocale ?? "en");
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    readInitialLocale(serverFallback)
  );
  const [hydrated, setHydrated] = useState(false);
  const [explicit, setExplicit] = useState(false);

  useEffect(() => {
    const nextLocale = readInitialLocale(serverFallback);
    setLocaleState(nextLocale);
    setExplicit(hasExplicitLocalePreference());
    setHydrated(true);
  }, [serverFallback]);

  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.lang = locale;
    // Only persist when the user chose a language — device default stays soft.
    if (explicit) {
      persistExplicitLocale(locale);
    }
  }, [locale, hydrated, explicit]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    const resolved = resolveAppLocale(nextLocale);
    setExplicit(true);
    setLocaleState(resolved);
    try {
      persistExplicitLocale(resolved);
    } catch {
      // Private mode / blocked storage — UI still updates for this session.
    }
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
