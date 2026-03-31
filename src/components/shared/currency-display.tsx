"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  className?: string;
  showOriginal?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency,
  className,
  showOriginal = false,
}: CurrencyDisplayProps) {
  const { baseCurrency, convert } = useCurrency();
  const convertedAmount = convert(amount, currency);
  const isConverted = currency !== baseCurrency;

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatCurrency(convertedAmount, baseCurrency)}
      {showOriginal && isConverted && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({formatCurrency(amount, currency)})
        </span>
      )}
    </span>
  );
}
