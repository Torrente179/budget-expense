"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "@/components/shared/category-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { CustomBudget } from "@/hooks/use-custom-budgets";
import { useLocale } from "@/providers/locale-provider";

interface CustomBudgetCardProps {
  budget: CustomBudget;
  spent: number;
  resolvedAmount: number;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (budget: CustomBudget) => void;
}

export function CustomBudgetCard({
  budget,
  spent,
  resolvedAmount,
  index,
  onDelete,
  onEdit,
}: CustomBudgetCardProps) {
  const { baseCurrency } = useCurrency();
  const { t, tc } = useLocale();
  const remaining = resolvedAmount - spent;
  const percentage = resolvedAmount > 0 ? (spent / resolvedAmount) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);

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

  const categories = budget.custom_budget_categories.map((c) => c.categories);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group rounded-lg border bg-card p-4 shadow-sm md:rounded-xl md:p-5 md:shadow-1"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-medium">{budget.name}</p>
          {budget.amount_type === "percentage" && (
            <Badge
              variant="outline"
              className="mt-1 bg-secondary/60 text-xs text-muted-foreground"
            >
              {budget.amount_value}% {t("of income", "del ingreso")}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-30 transition-opacity hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
            onClick={() => onEdit(budget)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-30 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <CategoryBadge
              key={cat.id}
              name={tc(cat.name)}
              icon={cat.icon}
              color={cat.color}
            />
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Target", "Objetivo")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold">
            {resolvedAmount > 0
              ? formatCurrency(resolvedAmount, baseCurrency)
              : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Spent", "Gastado")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold text-negative">
            {formatCurrency(spent, baseCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">
            {t("Remaining", "Restante")}
          </p>
          <p className={`mt-2 font-mono text-base font-semibold ${statusColor}`}>
            {resolvedAmount > 0
              ? formatCurrency(Math.abs(remaining), baseCurrency)
              : "--"}
          </p>
        </div>
      </div>

      {/* Progress */}
      {resolvedAmount > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`border-current/10 bg-secondary/60 ${statusColor}`}
            >
              {t(
                `${percentage.toFixed(0)}% used`,
                `${percentage.toFixed(0)}% usado`
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {remaining >= 0
                ? t("Within budget", "Dentro del presupuesto")
                : t("Overspent", "Excedido")}
            </span>
          </div>
          <Progress
            value={cappedPercentage}
            className={`gap-0 ${progressColor}`}
          />
        </div>
      )}
    </motion.div>
  );
}
