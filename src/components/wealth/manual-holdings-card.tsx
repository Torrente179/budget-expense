"use client";

import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { PALETTE } from "@/lib/palette";
import { formatCurrency } from "@/lib/utils";
import type { ResolvedInvestment } from "@/hooks/use-wealth-investments";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

/**
 * Holdings the user prices by hand, listed apart from trade-tracked positions
 * so it stays obvious which figures come from a price feed and which are a
 * number somebody typed.
 */
export function ManualHoldingsCard({
  investments,
}: {
  investments: ResolvedInvestment[];
}) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow={t("Manual", "Manual")}
          title={t("Valued by you", "Valoradas por ti")}
          description={t(
            "Holdings without a price feed — update the value when it changes.",
            "Posiciones sin cotización automática — actualiza el valor cuando cambie."
          )}
        />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {investments.map((item) => {
            const gainColor =
              item.gainBase === 0
                ? undefined
                : item.gainBase > 0
                  ? PALETTE.cashflow.income
                  : PALETTE.cashflow.expense;

            return (
              <li key={item.id}>
                <Link
                  href={`/wealth/investments/${item.id}`}
                  className="group flex items-center gap-3 py-3.5 transition-opacity hover:opacity-80"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${PALETTE.wealth.investments}1f`,
                      color: PALETTE.wealth.investments,
                    }}
                  >
                    <TrendingUp className="h-[18px] w-[18px]" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium">
                      {item.name}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {t("Contributed", "Aportado")}{" "}
                      {formatCurrency(item.costBase, baseCurrency)}
                      {item.institution ? ` · ${item.institution}` : ""}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-body font-medium tabular-nums">
                      {formatCurrency(item.valueBase, baseCurrency)}
                    </span>
                    <span
                      className="block font-mono text-caption tabular-nums"
                      style={{ color: gainColor }}
                    >
                      {item.gainBase > 0 ? "+" : ""}
                      {formatCurrency(item.gainBase, baseCurrency)}
                      {item.returnRatio !== null
                        ? ` · ${item.gainBase > 0 ? "+" : ""}${(
                            item.returnRatio * 100
                          ).toFixed(2)}%`
                        : ""}
                    </span>
                  </span>

                  <ChevronRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
