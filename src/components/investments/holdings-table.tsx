"use client";

import { AreaChart } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HoldingSummary } from "@/lib/investments";

interface HoldingsTableProps {
  holdings: HoldingSummary[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const { baseCurrency } = useCurrency();

  if (holdings.length === 0) {
    return (
      <EmptyState
        icon={AreaChart}
        title="No open positions yet"
        description="Add a buy order to start tracking holdings, FIFO lots, and marked market value."
      />
    );
  }

  return (
    <Card className="border-border/80 bg-card/96">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border/60 bg-secondary/35 text-left text-[0.72rem] uppercase tracking-[0.24em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Avg cost</th>
              <th className="px-4 py-3 font-medium">Latest</th>
              <th className="px-4 py-3 font-medium">Market value</th>
              <th className="px-4 py-3 font-medium">Unrealized</th>
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
                        ? "Manual"
                        : formatCurrency(holding.latestPrice, holding.latestCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {holding.priceStatus.replaceAll("_", " ")}
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
                        ? "text-emerald-300"
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
