"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type CurrencyTone = "default" | "positive" | "negative" | "muted";

const toneClass: Record<CurrencyTone, string | undefined> = {
  default: undefined,
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-muted-foreground",
};

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  tone?: CurrencyTone;
  className?: string;
  showOriginal?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency,
  tone = "default",
  className,
  showOriginal = false,
}: CurrencyDisplayProps) {
  const { baseCurrency, convert } = useCurrency();
  const convertedAmount = convert(amount, currency);
  const isConverted = currency !== baseCurrency;

  return (
    <span className={cn("font-mono tabular-nums", toneClass[tone], className)}>
      {formatCurrency(convertedAmount, baseCurrency)}
      {showOriginal && isConverted && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({formatCurrency(amount, currency)})
        </span>
      )}
    </span>
  );
}
