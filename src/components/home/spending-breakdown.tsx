"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AmountText } from "@/components/patterns/amount-text";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface HomeSpendingCategory {
  id: string;
  name: string;
  value: number;
  color: string;
  expenseCount: number;
}

interface SpendingBreakdownProps {
  categories: HomeSpendingCategory[];
  total: number;
  onSelect?: (categoryId: string) => void;
  className?: string;
}

/**
 * Home's compact category readout. The stacked bar preserves the whole-month
 * composition while the ranked rows keep every category, amount and drill-down
 * available without the dashboard-style donut.
 */
export function SpendingBreakdown({
  categories,
  total,
  onSelect,
  className,
}: SpendingBreakdownProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const ranked = [...categories].sort((a, b) => b.value - a.value);

  if (ranked.length === 0 || total <= 0) return null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 ring-border",
        className
      )}
    >
      <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="label-caps">{t("This month", "Este mes")}</p>
          <h2 className="mt-0.5 text-heading font-semibold">
            {t("Spending breakdown", "Desglose de gastos")}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-label text-muted-foreground">
            {t("Total spent", "Total gastado")}
          </p>
          <AmountText
            amount={total}
            currency={baseCurrency}
            size="body"
            className="font-bold"
          />
        </div>
      </div>

      <div
        className="mx-4 flex h-2 overflow-hidden rounded-sm bg-muted"
        role="img"
        aria-label={t(
          "Spending split across categories",
          "Distribución de gastos entre categorías"
        )}
      >
        {ranked.map((category) => (
          <span
            key={category.id}
            className="h-full min-w-px"
            style={{
              backgroundColor: category.color,
              width: `${(category.value / total) * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="mt-3 divide-y divide-border/60 border-t border-border/60">
        {ranked.map((category, index) => {
          const percent = Math.round((category.value / total) * 100);
          const content = (
            <>
              <span className="w-5 shrink-0 text-center font-mono text-label tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium">
                  {category.name}
                </span>
                <span className="block text-label text-muted-foreground">
                  {t(
                    `${category.expenseCount} ${category.expenseCount === 1 ? "movement" : "movements"}`,
                    `${category.expenseCount} ${category.expenseCount === 1 ? "movimiento" : "movimientos"}`
                  )}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <AmountText
                  amount={category.value}
                  currency={baseCurrency}
                  size="caption"
                  className="block font-semibold"
                />
                <span className="block font-mono text-label tabular-nums text-muted-foreground">
                  {percent}%
                </span>
              </span>
              {onSelect ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              ) : null}
            </>
          );

          return onSelect ? (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
            >
              {content}
            </button>
          ) : (
            <div
              key={category.id}
              className="flex min-h-12 items-center gap-2.5 px-3 py-2"
            >
              {content}
            </div>
          );
        })}
      </div>

      <Link
        href="/insights"
        className="flex items-center justify-center border-t border-border px-4 py-3 text-caption font-semibold text-primary transition-colors hover:bg-accent/40"
      >
        {t("See all insights", "Ver todos los análisis")}
      </Link>
    </section>
  );
}
