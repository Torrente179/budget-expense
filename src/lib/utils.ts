import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CURRENCIES } from "./constants";

export type AppLocale = "en" | "es";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getDocumentLocale() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.documentElement.lang || null;
}

/**
 * Map a BCP-47 tag (or Accept-Language snippet) to the app's two locales.
 * Spanish → es; English → en; anything else → en.
 */
export function resolveAppLocale(locale?: string | null): AppLocale {
  const candidate = (locale ?? getDocumentLocale() ?? "en").toLowerCase();
  if (candidate.startsWith("es")) return "es";
  if (candidate.startsWith("en")) return "en";
  return "en";
}

/** Highest-preference tag from an Accept-Language header. */
export function preferredLanguageFromAcceptHeader(
  header?: string | null
): string | null {
  if (!header?.trim()) return null;

  const parts = header.split(",").map((chunk) => {
    const [rawTag, ...params] = chunk.trim().split(";");
    const qParam = params.find((item) => item.trim().startsWith("q="));
    const quality = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "1") : 1;
    return {
      tag: (rawTag ?? "").trim().toLowerCase(),
      quality: Number.isFinite(quality) ? quality : 0,
    };
  });

  parts.sort((a, b) => b.quality - a.quality);
  return parts.find((part) => part.tag)?.tag ?? null;
}

/** Device / phone primary language → app locale (unsupported → English). */
export function localeFromDeviceLanguages(
  languages: readonly string[] | string | null | undefined
): AppLocale {
  const list = Array.isArray(languages)
    ? languages
    : languages
      ? [languages]
      : [];
  const primary = list[0] ?? null;
  return resolveAppLocale(primary);
}

export function localeFromAcceptLanguage(header?: string | null): AppLocale {
  return resolveAppLocale(preferredLanguageFromAcceptHeader(header));
}

export function getIntlLocale(locale?: string | null) {
  return resolveAppLocale(locale) === "es" ? "es-ES" : "en-US";
}

function getDateFnsLocale(locale?: string | null) {
  return resolveAppLocale(locale) === "es" ? es : enUS;
}

export function formatDate(
  date: string | Date,
  pattern: string = "MMM d, yyyy",
  locale?: string | null
) {
  const d = typeof date === "string" ? parseISO(date) : date;
  // Fall back to <html lang> so callers that omit locale still follow the
  // active app language (critical on mobile Movements / Insights).
  return format(d, pattern, {
    locale: getDateFnsLocale(locale ?? getDocumentLocale()),
  });
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currencyCode: string, locale?: string | null) {
  const intlLocale = getIntlLocale(locale);
  const key = `${intlLocale}:${currencyCode}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "EUR",
  locale?: string | null
) {
  return getCurrencyFormatter(currencyCode, locale).format(amount);
}

export function getCurrencySymbol(code: string) {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol ?? code;
}

export function getMonthName(month: number, locale?: string | null) {
  return format(new Date(2024, month - 1, 1), "MMMM", {
    locale: getDateFnsLocale(locale),
  });
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function normalizeDecimalInput(value: string) {
  const compact = value.trim().replace(/\s+/g, "");

  if (!compact) {
    return "";
  }

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      return compact.replace(/\./g, "").replace(",", ".");
    }

    return compact.replace(/,/g, "");
  }

  if (lastComma !== -1) {
    return compact.replace(/,/g, ".");
  }

  return compact;
}

export function parseDecimalInput(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const normalized = normalizeDecimalInput(value);

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}
