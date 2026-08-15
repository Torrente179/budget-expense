"use client";

import type { Ref } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export type CaptureKind = "expense" | "income";

export interface CaptureChromeProps {
  title: string;
  kind: CaptureKind;
  amount: string;
  currency: string;
  isEdit?: boolean;
  amountRef?: Ref<HTMLInputElement>;
  onKindChange?: (kind: CaptureKind) => void;
  onAmountChange?: (amount: string) => void;
  onCurrencyChange?: (currency: string) => void;
  titleElement?: "sheet" | "heading";
}

/**
 * Production capture header shared with the isolated design harness. It owns
 * only presentation; validation, defaults, suggestions and persistence stay
 * in CaptureSheet.
 */
export function CaptureChrome({
  title,
  kind,
  amount,
  currency,
  isEdit = false,
  amountRef,
  onKindChange,
  onAmountChange,
  onCurrencyChange,
  titleElement = "sheet",
}: CaptureChromeProps) {
  const { t } = useLocale();
  const currencyItems = CURRENCIES.map((item) => ({
    value: item.code,
    label: item.code,
  }));

  return (
    <div className="shrink-0 bg-ink px-5 pb-5 pt-1 text-white">
      <SheetHeader className="px-0 pb-3 pt-0">
        <p className="label-caps text-white/42">
          {t("Quick capture", "Captura rápida")}
        </p>
        {titleElement === "sheet" ? (
          <SheetTitle className="text-heading text-white">{title}</SheetTitle>
        ) : (
          <h2 className="text-heading font-medium text-white">{title}</h2>
        )}
      </SheetHeader>

      {!isEdit && (
        <div
          role="tablist"
          aria-label={t("Movement type", "Tipo de movimiento")}
          className="grid shrink-0 grid-cols-2 border-b border-white/12"
        >
          {(
            [
              ["expense", t("Expense", "Gasto")],
              ["income", t("Income", "Ingreso")],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              onClick={() => onKindChange?.(value)}
              className={cn(
                "relative min-h-11 py-2 text-body font-medium transition-colors duration-[var(--motion-standard)]",
                kind === value
                  ? "text-coral after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-coral"
                  : "text-white/48 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-end gap-3">
        <Input
          id="capture-amount"
          ref={amountRef}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          onChange={(event) => onAmountChange?.(event.target.value)}
          aria-label={t("Amount", "Importe")}
          className={cn(
            "h-14 min-w-0 flex-1 border-0 bg-transparent px-0 text-center font-mono text-[2.65rem] font-semibold leading-none tracking-[-0.05em] text-coral shadow-none focus-visible:ring-0",
            kind === "income" && "text-success"
          )}
        />
        <Select
          value={currency}
          onValueChange={(value) => {
            if (value) onCurrencyChange?.(value);
          }}
          items={currencyItems}
        >
          <SelectTrigger
            aria-label={t("Currency", "Moneda")}
            className="h-11 w-20 shrink-0 border-white/12 bg-white/[0.07] font-mono text-sm text-white"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((item) => (
              <SelectItem key={item.code} value={item.code} className="text-sm">
                {item.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
