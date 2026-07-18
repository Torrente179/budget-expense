"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/category-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/types/database";
import { useLocale } from "@/providers/locale-provider";

type Budget = Database["public"]["Tables"]["budgets"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  spentCurrency: string;
  index: number;
  poolAmount?: number;
  onDelete: (id: string) => void;
}

export function BudgetCard({
  budget,
  spent,
  spentCurrency,
  index,
  poolAmount = 0,
  onDelete,
}: BudgetCardProps) {
  const { baseCurrency, convert } = useCurrency();
  const { t, tc } = useLocale();
  const budgetAmount = convert(budget.amount, budget.currency);
  const spentAmount = convert(spent, spentCurrency);
  const remaining = budgetAmount - spentAmount;
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);
  const shareOfPool = poolAmount > 0 ? (budgetAmount / poolAmount) * 100 : 0;

  const status =
    percentage >= 90
      ? "danger"
      : percentage >= 75
        ? "warning"
        : "good";

  const statusColor = {
    good: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[status];

  const progressColor = {
    good: "[&_[data-slot=progress-indicator]]:bg-success",
    warning: "[&_[data-slot=progress-indicator]]:bg-warning",
    danger: "[&_[data-slot=progress-indicator]]:bg-danger",
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-lg border bg-card p-4 shadow-sm md:rounded-xl md:p-5 md:shadow-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CategoryIcon
            icon={budget.categories.icon}
            color={budget.categories.color}
            className="h-10 w-10 rounded-2xl"
          />
          <div>
            <p className="text-base font-medium">{tc(budget.categories.name)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shareOfPool > 0
                ? t(
                    `${shareOfPool.toFixed(0)}% of the monthly pool`,
                    `${shareOfPool.toFixed(0)}% del fondo mensual`
                  )
                : t("Category envelope", "Sobre de categoría")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground opacity-30 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
          onClick={() => onDelete(budget.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Reserved", "Reservado")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold">
            {formatCurrency(budgetAmount, baseCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Consumed", "Consumido")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold text-negative">
            {formatCurrency(spentAmount, baseCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Left", "Disponible")}
          </p>
          <p className={`mt-2 font-mono text-base font-semibold ${statusColor}`}>
            {formatCurrency(Math.abs(remaining), baseCurrency)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`border-current/10 bg-secondary/60 ${statusColor}`}
          >
            {t(`${percentage.toFixed(0)}% used`, `${percentage.toFixed(0)}% usado`)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {remaining >= 0
              ? t("Within envelope", "Dentro del sobre")
              : t("Overspent", "Excedido")}
          </span>
        </div>
        <Progress value={cappedPercentage} className={`gap-0 ${progressColor}`} />
      </div>
    </motion.div>
  );
}
