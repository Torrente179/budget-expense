"use client";

import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "@/providers/locale-provider";

interface SummaryCardsProps {
  totalIncome: number;
  totalSpent: number;
  availableBalance: number;
  previousMonthTotal: number;
  allocationPercent: number | null;
  hasPlan: boolean;
}

export function SummaryCards({
  totalIncome,
  totalSpent,
  availableBalance,
  previousMonthTotal,
  allocationPercent,
  hasPlan,
}: SummaryCardsProps) {
  const { baseCurrency } = useCurrency();
  const { t } = useLocale();

  const monthChange =
    previousMonthTotal > 0
      ? ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100
      : 0;
  const cards = [
    {
      id: "spent",
      label: t("Spent this month", "Gastado este mes"),
      value: formatCurrency(totalSpent, baseCurrency),
      detail:
        previousMonthTotal > 0
          ? t(
              `${Math.abs(monthChange).toFixed(1)}% vs last month`,
              `${Math.abs(monthChange).toFixed(1)}% vs mes anterior`
            )
          : t(
              "First month with comparable data",
              "Primer mes con datos comparables"
            ),
      status: previousMonthTotal > 0 ? monthChange : null,
      statusKind: "delta",
      icon: Wallet,
    },
    {
      id: "income",
      label: t("Income this month", "Ingresos del mes"),
      value: formatCurrency(totalIncome, baseCurrency),
      detail: t(
        "Registered gains and incoming cash flow",
        "Ganancias registradas y flujo de entrada"
      ),
      status: null,
      icon: TrendingUp,
    },
    {
      id: "total",
      label: t("Available total", "Total disponible"),
      value: formatCurrency(availableBalance, baseCurrency),
      detail: hasPlan
        ? t(
            `${allocationPercent}% of income protected as budget pool`,
            `${allocationPercent}% del ingreso protegido como fondo`
          )
        : t(
            "Income minus expenses. Can go negative.",
            "Ingresos menos gastos. Puede ir a negativo."
          ),
      status: availableBalance,
      statusKind: "currency",
      icon: Wallet,
      invert: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const positive = card.invert
          ? (card.status ?? 0) >= 0
          : (card.status ?? 0) <= 0;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="border-border/80 bg-card/96">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2.5">
                    <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="font-heading text-[2.15rem] font-semibold leading-none tracking-[-0.045em]">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground",
                      card.id === "total" &&
                        positive &&
                        "bg-emerald-500/12 text-emerald-300"
                    )}
                  >
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm leading-6 text-muted-foreground">{card.detail}</p>
                  {card.status !== null && (
                    <Badge
                      variant="outline"
                      className={
                        positive
                          ? "h-7 rounded-full border-emerald-500/18 bg-emerald-500/10 px-2.5 text-emerald-300"
                          : "h-7 rounded-full border-destructive/20 bg-destructive/10 px-2.5 text-destructive"
                      }
                    >
                      {positive ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {card.statusKind === "currency"
                        ? formatCurrency(Math.abs(card.status), baseCurrency)
                        : `${Math.abs(card.status).toFixed(1)}%`}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
