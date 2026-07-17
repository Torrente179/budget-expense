"use client";

import { AreaChart } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HoldingSummary } from "@/lib/investments";
import { useLocale } from "@/providers/locale-provider";

interface HoldingsTableProps {
  holdings: HoldingSummary[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const { baseCurrency } = useCurrency();
  const { t } = useLocale();
  const priceStatusLabel: Record<string, string> = {
    fetched: t("fetched", "obtenido"),
    fallback_previous_trading_day: t(
      "fallback previous trading day",
      "día hábil anterior"
    ),
    unavailable: t("unavailable", "no disponible"),
    manual_only: t("manual only", "solo manual"),
  };

  if (holdings.length === 0) {
    return (
      <EmptyState
        icon={AreaChart}
        title={t("No open positions yet", "Aún no hay posiciones abiertas")}
        description={t(
          "Add a buy order to start tracking holdings, FIFO lots, and marked market value.",
          "Agrega una orden de compra para empezar a seguir tenencias, lotes FIFO y valor de mercado."
        )}
      />
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader className="border-b border-border/70">
        <CardTitle>{t("Holdings", "Tenencias")}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border/60 bg-secondary/35 text-left label-caps">
            <tr>
              <th className="px-4 py-3 font-medium">{t("Asset", "Activo")}</th>
              <th className="px-4 py-3 font-medium">
                {t("Quantity", "Cantidad")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("Avg cost", "Costo prom.")}
              </th>
              <th className="px-4 py-3 font-medium">{t("Latest", "Último")}</th>
              <th className="px-4 py-3 font-medium">
                {t("Market value", "Valor de mercado")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("Unrealized", "No realizada")}
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.assetId} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{holding.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {holding.displayName ?? holding.marketCode}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono">
                  {holding.quantity.toFixed(holding.assetType === "crypto" ? 6 : 4)}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatCurrency(holding.avgCost, baseCurrency)}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="font-mono">
                      {holding.latestPrice === null
                        ? t("Manual", "Manual")
                        : formatCurrency(holding.latestPrice, holding.latestCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {priceStatusLabel[holding.priceStatus] ??
                        holding.priceStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatCurrency(holding.marketValue, baseCurrency)}
                </td>
                <td className="px-4 py-4 font-mono">
                  <span
                    className={
                      holding.unrealizedPnl >= 0
                        ? "text-success"
                        : "text-destructive"
                    }
                  >
                    {formatCurrency(holding.unrealizedPnl, baseCurrency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
