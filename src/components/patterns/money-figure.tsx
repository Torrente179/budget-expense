"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

interface MoneyFigureProps {
  /** Amount already expressed in `currency` — this does not convert. */
  amount: number | null;
  currency: string;
  /** Colour of the small currency sign and cents. Defaults to muted text. */
  minorClassName?: string;
  className?: string;
}

/**
 * Size steps for the whole-number part, keyed by how many characters it has
 * once grouped. A five-character figure like `3,128` gets the full hero size;
 * longer figures step down so they never leave their container.
 */
function figureSize(length: number): { major: string; minor: string } {
  if (length <= 5) return { major: "text-[4.875rem]", minor: "text-[1.875rem]" };
  if (length <= 7) return { major: "text-[3.75rem]", minor: "text-2xl" };
  if (length <= 9) return { major: "text-5xl", minor: "text-xl" };
  if (length <= 11) return { major: "text-[2.5rem]", minor: "text-lg" };
  return { major: "text-3xl", minor: "text-base" };
}

/**
 * The hero money figure: a very large whole number with the currency sign and
 * the cents set small and raised beside it. Locale decides which side the sign
 * sits on, so `€3,128.42` and `3.128,42 €` both read naturally.
 */
export function MoneyFigure({
  amount,
  currency,
  minorClassName = "text-muted-foreground",
  className,
}: MoneyFigureProps) {
  const { intlLocale } = useLocale();

  if (amount == null || !Number.isFinite(amount)) {
    return (
      <span className={cn("stream-figure text-[4.875rem]", className)}>—</span>
    );
  }

  const parts = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
  }).formatToParts(amount);
  const major = parts
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("");
  const minor = parts
    .filter((part) => part.type === "decimal" || part.type === "fraction")
    .map((part) => part.value)
    .join("");
  const sign = parts.find((part) => part.type === "currency")?.value ?? "";
  const minus = parts.find((part) => part.type === "minusSign")?.value ?? "";
  const signLeads =
    parts.findIndex((part) => part.type === "currency") <
    parts.findIndex((part) => part.type === "integer");
  const size = figureSize(major.length);
  const minorClass = cn("mt-[0.4em] font-bold", size.minor, minorClassName);
  const full = parts.map((part) => part.value).join("");

  return (
    <span className={cn("stream-figure flex min-w-0 items-start", className)}>
      {/* The parts below are set at different sizes, so the whole amount is
          offered once, intact, to assistive tech and to text search. */}
      <span className="sr-only">{full}</span>
      {(minus || signLeads) && (
        <span aria-hidden className={cn(minorClass, "mr-1 whitespace-nowrap")}>
          {minus}
          {signLeads ? sign : ""}
        </span>
      )}
      <span aria-hidden className={size.major}>
        {major}
      </span>
      <span aria-hidden className={cn(minorClass, "whitespace-nowrap")}>
        {minor}
        {!signLeads && sign ? ` ${sign}` : ""}
      </span>
    </span>
  );
}
