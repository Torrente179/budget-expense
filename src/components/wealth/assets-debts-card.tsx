"use client";

import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import {
  BreakdownDonut,
  type DonutSlice,
} from "@/components/patterns/breakdown-donut";
import { EmptyState } from "@/components/shared/empty-state";
import { PALETTE } from "@/lib/palette";
import type { NetWorthTotals } from "@/lib/wealth/net-worth";
import { useLocale } from "@/providers/locale-provider";

/**
 * Assets against debts — the balance sheet in one ring, with net worth in the
 * middle so the subtraction is visible rather than implied.
 */
export function AssetsDebtsCard({ totals }: { totals: NetWorthTotals }) {
  const { t } = useLocale();

  const slices: DonutSlice[] = [
    {
      id: "assets",
      name: t("Assets", "Activos"),
      value: totals.totalAssets,
      color: PALETTE.cashflow.income,
    },
    {
      id: "debts",
      name: t("Debts", "Deudas"),
      value: totals.totalLiabilities,
      color: PALETTE.cashflow.expense,
    },
  ].filter((slice) => slice.value > 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <SectionHeader
          eyebrow={t("Balance", "Balance")}
          title={t("Assets and debts", "Activos y deudas")}
        />
      </CardHeader>
      <CardContent>
        {slices.length > 0 ? (
          <BreakdownDonut
            slices={slices}
            centerLabel={t("Net worth", "Patrimonio neto")}
            centerValue={totals.netWorth}
            calloutCount={0}
            size={132}
          />
        ) : (
          <EmptyState
            icon={PieChart}
            title={t("Nothing to compare yet", "Aún no hay nada que comparar")}
            description={t(
              "Add an account or a debt to see the balance.",
              "Añade una cuenta o una deuda para ver el balance."
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
