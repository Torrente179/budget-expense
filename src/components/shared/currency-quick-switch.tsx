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
import { toast } from "sonner";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

export function CurrencyQuickSwitch({
  onInk = false,
}: {
  onInk?: boolean;
}) {
  const {
    baseCurrency,
    currencyPreferenceReady,
    currencyPreferenceUpdating,
    setBaseCurrency,
  } = useCurrency();
  const { t } = useLocale();

  async function handleCurrencyChange(code: CurrencyCode) {
    try {
      await setBaseCurrency(code);
    } catch (error) {
      console.error("Failed to update profile currency", error);
      toast.error(
        t("Failed to update currency", "No se pudo actualizar la moneda")
      );
    }
  }

  return (
    <Select
      value={baseCurrency}
      onValueChange={(value) => {
        void handleCurrencyChange(value as CurrencyCode);
      }}
      disabled={!currencyPreferenceReady || currencyPreferenceUpdating}
    >
      <SelectTrigger
        aria-label={t("Base currency", "Moneda base")}
        className={cn(
          "h-11 w-[90px] font-mono text-xs md:h-9",
          onInk && "border-white/10 bg-white/[0.07] text-white"
        )}
      >
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
