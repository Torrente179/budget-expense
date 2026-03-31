"use client";

import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/category-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/types/database";

type Budget = Database["public"]["Tables"]["budgets"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  spentCurrency: string;
  index: number;
  onDelete: (id: string) => void;
}

export function BudgetCard({
  budget,
  spent,
  spentCurrency,
  index,
  onDelete,
}: BudgetCardProps) {
  const { baseCurrency, convert } = useCurrency();
  const budgetAmount = convert(budget.amount, budget.currency);
  const spentAmount = convert(spent, spentCurrency);
  const remaining = budgetAmount - spentAmount;
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);

  const status =
    percentage >= 90
      ? "danger"
      : percentage >= 75
        ? "warning"
        : "good";

  const statusColor = {
    good: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  }[status];

  const progressColor = {
    good: "[&>div]:bg-emerald-500",
    warning: "[&>div]:bg-amber-500",
    danger: "[&>div]:bg-red-500",
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
      className="group rounded-lg border border-border/50 p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon
            icon={budget.categories.icon}
            color={budget.categories.color}
          />
          <div>
            <p className="text-sm font-medium">{budget.categories.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatCurrency(spentAmount, baseCurrency)} /{" "}
              {formatCurrency(budgetAmount, baseCurrency)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(budget.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        <Progress value={cappedPercentage} className={`h-1.5 ${progressColor}`} />
        <div className="flex items-center justify-between">
          <span className={`font-mono text-xs font-medium ${statusColor}`}>
            {percentage.toFixed(0)}%
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {remaining >= 0
              ? `${formatCurrency(remaining, baseCurrency)} left`
              : `${formatCurrency(Math.abs(remaining), baseCurrency)} over`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
