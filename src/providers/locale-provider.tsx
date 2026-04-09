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
import { CATEGORY_TRANSLATIONS } from "@/lib/constants";

const LOCALE_STORAGE_KEY = "be-locale";
const LOCALE_COOKIE_KEY = "be_locale";

interface LocaleContextValue {
  locale: AppLocale;
  intlLocale: string;
  setLocale: (locale: AppLocale) => void;
  t: (english: string, spanish: string) => string;
  /** Translate a category name stored in English to the active locale. */
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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieLocale = readCookieLocale();
    const browserLocale = window.navigator.language;
    const nextLocale = resolveAppLocale(stored ?? cookieLocale ?? browserLocale);
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(resolveAppLocale(nextLocale));
  }, []);

  const t = useCallback(
    (english: string, spanish: string) => (locale === "es" ? spanish : english),
    [locale]
  );

  const tc = useCallback(
    (name: string) =>
      locale === "es" ? (CATEGORY_TRANSLATIONS[name] ?? name) : name,
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
