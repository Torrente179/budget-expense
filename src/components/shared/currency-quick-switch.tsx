"use client";

import { useCurrency } from "@/providers/currency-provider";
import { CURRENCIES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CurrencyCode } from "@/lib/constants";

export function CurrencyQuickSwitch() {
  const { baseCurrency, setBaseCurrency } = useCurrency();

  return (
    <Select
      value={baseCurrency}
      onValueChange={(val) => setBaseCurrency(val as CurrencyCode)}
    >
      <SelectTrigger className="h-8 w-[90px] text-xs font-mono">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code} className="text-xs">
            <span className="mr-1">{c.flag}</span> {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
