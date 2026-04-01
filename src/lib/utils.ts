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

export function resolveAppLocale(locale?: string | null): AppLocale {
  const candidate = (locale ?? getDocumentLocale() ?? "en").toLowerCase();
  return candidate.startsWith("es") ? "es" : "en";
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
  return format(d, pattern, { locale: getDateFnsLocale(locale) });
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "EUR",
  locale?: string | null
) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
