"use client";

import { motion } from "framer-motion";
import {
  Landmark,
  LineChart,
  WalletCards,
  TrendingUp,
} from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";

interface InvestmentOverviewCardsProps {
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  openPositionsCount: number;
}

export function InvestmentOverviewCards({
  totalMarketValue,
  totalUnrealizedPnl,
  totalRealizedPnl,
  openPositionsCount,
}: InvestmentOverviewCardsProps) {
  const { baseCurrency } = useCurrency();
  const { t } = useLocale();

  const cards = [
    {
      label: t("Market value", "Valor de mercado"),
      value: formatCurrency(totalMarketValue, baseCurrency),
      detail: t(
        "Marked with latest cached daily prices",
        "Valorizado con los últimos precios diarios en caché"
      ),
      icon: Landmark,
    },
    {
      label: t("Unrealized P&L", "P&G no realizada"),
      value: formatCurrency(totalUnrealizedPnl, baseCurrency),
      detail: t("Open positions only", "Solo posiciones abiertas"),
      icon: TrendingUp,
    },
    {
      label: t("Realized P&L", "P&G realizada"),
      value: formatCurrency(totalRealizedPnl, baseCurrency),
      detail: t("FIFO lot accounting", "Contabilidad FIFO por lotes"),
      icon: LineChart,
    },
    {
      label: t("Open positions", "Posiciones abiertas"),
      value: String(openPositionsCount),
      detail: t(
        "Distinct assets with remaining quantity",
        "Activos distintos con cantidad remanente"
      ),
      icon: WalletCards,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-border/80 bg-card/96">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="font-heading text-[2rem] font-semibold leading-none tracking-[-0.04em]">
                    {card.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
