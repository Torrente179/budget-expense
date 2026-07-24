"use client";

import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface PlanSlice {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface PlanDistributionCardProps {
  monthlyIncome: number | null;
  slices: PlanSlice[];
}

/**
 * Planned allocation vs income (not actual spend).
 */
export function PlanDistributionCard({
  monthlyIncome,
  slices,
}: PlanDistributionCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  const allocated = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const unallocated =
    monthlyIncome != null ? monthlyIncome - allocated : null;
  const totalForBar =
    monthlyIncome != null && monthlyIncome > 0
      ? monthlyIncome
      : Math.max(allocated, 1);

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {slices.map((slice) => {
          const width = Math.max((slice.amount / totalForBar) * 100, 0);
          if (width <= 0) return null;
          return (
            <div
              key={slice.id}
              className="h-full"
              style={{ width: `${width}%`, backgroundColor: slice.color }}
              title={slice.name}
            />
          );
        })}
        {unallocated != null && unallocated > 0 && (
          <div
            className="h-full bg-border"
            style={{ width: `${(unallocated / totalForBar) * 100}%` }}
          />
        )}
      </div>

      <div className="space-y-2">
        {slices.map((slice) => {
          const pct =
            monthlyIncome != null && monthlyIncome > 0
              ? Math.round((slice.amount / monthlyIncome) * 1000) / 10
              : null;
          return (
            <div
              key={slice.id}
              className="flex items-center justify-between gap-3 text-caption"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-body">{slice.name}</span>
              </span>
              <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                {formatCurrency(slice.amount, baseCurrency, intlLocale)}
                {pct != null ? ` · ${pct}%` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {unallocated != null && (
        <p className="text-caption text-muted-foreground">
          {unallocated >= 0
            ? t(
                `${formatCurrency(unallocated, baseCurrency, intlLocale)} unallocated`,
                `${formatCurrency(unallocated, baseCurrency, intlLocale)} sin asignar`
              )
            : t(
                `Plan over-allocated by ${formatCurrency(Math.abs(unallocated), baseCurrency, intlLocale)}`,
                `Plan sobreasignado por ${formatCurrency(Math.abs(unallocated), baseCurrency, intlLocale)}`
              )}
        </p>
      )}
    </div>
  );
}
