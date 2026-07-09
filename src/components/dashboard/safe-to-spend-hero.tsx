"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface SafeToSpendHeroProps {
  totalIncome: number;
  totalSpent: number;
  totalInvestmentTransfers: number;
  totalBudget: number;
}

/**
 * The one number the mobile home screen exists to answer: "can I spend
 * this?" Budget-aware: the stricter of cash actually available and the
 * month's remaining budget, with a one-line why.
 */
export function SafeToSpendHero({
  totalIncome,
  totalSpent,
  totalInvestmentTransfers,
  totalBudget,
}: SafeToSpendHeroProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  const cashAvailable = totalIncome - totalSpent - totalInvestmentTransfers;
  const budgetRemaining = totalBudget > 0 ? totalBudget - totalSpent : null;
  const safeToSpend =
    budgetRemaining !== null
      ? Math.min(cashAvailable, budgetRemaining)
      : cashAvailable;
  const boundByBudget =
    budgetRemaining !== null && budgetRemaining < cashAvailable;
  const positive = safeToSpend >= 0;

  return (
    <Card className="md:hidden">
      <CardContent className="space-y-1.5 py-5 text-center">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {t("Safe to spend", "Disponible para gastar")}
        </p>
        <p
          className={`font-heading text-[2.6rem] leading-none tracking-[-0.045em] ${
            positive ? "text-emerald-300" : "text-destructive"
          }`}
        >
          {formatCurrency(safeToSpend, baseCurrency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {boundByBudget
            ? t(
                `Budget cap: ${formatCurrency(budgetRemaining ?? 0, baseCurrency)} left of ${formatCurrency(totalBudget, baseCurrency)} plan`,
                `Límite del plan: quedan ${formatCurrency(budgetRemaining ?? 0, baseCurrency)} de ${formatCurrency(totalBudget, baseCurrency)}`
              )
            : t(
                `Income − spent − transfers this month`,
                `Ingresos − gastos − transferencias del mes`
              )}
        </p>
      </CardContent>
    </Card>
  );
}
