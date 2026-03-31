"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface SummaryCardsProps {
  totalSpent: number;
  totalBudget: number;
  previousMonthTotal: number;
  topCategory: { name: string; amount: number } | null;
}

export function SummaryCards({
  totalSpent,
  totalBudget,
  previousMonthTotal,
  topCategory,
}: SummaryCardsProps) {
  const { baseCurrency } = useCurrency();

  const monthChange =
    previousMonthTotal > 0
      ? ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100
      : 0;
  const budgetRemaining = totalBudget - totalSpent;
  const savingsRate = totalBudget > 0 ? (budgetRemaining / totalBudget) * 100 : 0;

  const cards = [
    {
      label: "TOTAL SPENT",
      value: formatCurrency(totalSpent, baseCurrency),
      icon: Wallet,
      change: previousMonthTotal > 0 ? monthChange : null,
      changeLabel: "vs last month",
    },
    {
      label: "BUDGET LEFT",
      value:
        totalBudget > 0
          ? formatCurrency(Math.max(budgetRemaining, 0), baseCurrency)
          : "No budget",
      icon: PiggyBank,
      change: totalBudget > 0 ? savingsRate : null,
      changeLabel: "remaining",
      invertColor: true,
    },
    {
      label: "SAVINGS RATE",
      value: totalBudget > 0 ? `${Math.max(savingsRate, 0).toFixed(0)}%` : "--",
      icon: Target,
      change: null,
      changeLabel: "",
    },
    {
      label: "TOP CATEGORY",
      value: topCategory?.name ?? "--",
      icon: topCategory ? TrendingUp : TrendingDown,
      change: null,
      changeLabel: topCategory
        ? formatCurrency(topCategory.amount, baseCurrency)
        : "",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2, ease: "easeOut" }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {card.label}
                </span>
                <card.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-2 font-mono text-xl font-semibold tracking-tight">
                {card.value}
              </p>
              {(card.change !== null || card.changeLabel) && (
                <div className="mt-1 flex items-center gap-1">
                  {card.change !== null && (
                    <>
                      {(card.invertColor ? card.change >= 0 : card.change <= 0) ? (
                        <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={`font-mono text-xs ${
                          (card.invertColor
                            ? card.change >= 0
                            : card.change <= 0)
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {card.changeLabel}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
