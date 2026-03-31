import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { CURRENCIES } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern: string = "MMM d, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern)
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "EUR",
  locale: string = "en-US"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(code: string) {
  const currency = CURRENCIES.find((c) => c.code === code)
  return currency?.symbol ?? code
}

export function getMonthName(month: number) {
  return format(new Date(2024, month - 1, 1), "MMMM")
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1
}

export function getCurrentYear() {
  return new Date().getFullYear()
}
