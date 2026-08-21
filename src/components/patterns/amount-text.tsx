"use client";

import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency } from "@/lib/utils";

type AmountTone = "default" | "positive" | "negative" | "muted";
type AmountSize = "display" | "title" | "heading" | "body" | "caption";

const toneClass: Record<AmountTone, string> = {
  default: "text-foreground",
  positive: "text-positive",
  // Expenses are neutral ink — green stays reserved for income.
  negative: "text-foreground",
  muted: "text-muted-foreground",
};

const sizeClass: Record<AmountSize, string> = {
  display: "text-display font-semibold",
  title: "text-title font-semibold",
  heading: "text-heading font-semibold",
  body: "text-body font-medium",
  caption: "text-caption",
};

interface AmountTextProps {
  amount: number;
  currency: string;
  tone?: AmountTone;
  size?: AmountSize;
  /** Prefix positive amounts with "+" (income, gains). */
  signed?: boolean;
  /** Append the original amount when it was converted from another currency. */
  showOriginal?: boolean;
  className?: string;
}

/**
 * The one way to render money: converts through the currency provider,
 * keeps numerals in tabular mono, and applies semantic tone.
 */
export function AmountText({
  amount,
  currency,
  tone = "default",
  size = "body",
  signed = false,
  showOriginal = false,
  className,
}: AmountTextProps) {
  const { baseCurrency, convert } = useCurrency();
  const converted = convert(amount, currency);
  const isConverted = currency !== baseCurrency;
  const prefix = signed && converted > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        sizeClass[size],
        toneClass[tone],
        className
      )}
    >
      {prefix}
      {formatCurrency(converted, baseCurrency)}
      {showOriginal && isConverted && (
        <span className="block whitespace-nowrap text-caption font-normal text-muted-foreground">
          ({formatCurrency(amount, currency)})
        </span>
      )}
    </span>
  );
}
