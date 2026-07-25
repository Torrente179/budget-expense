"use client";

import type { CSSProperties } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import {
  budgetUsageColorForRatio,
  resolveBudgetUsageTone,
  BUDGET_USAGE_BANDS,
} from "@/lib/palette";
import { CategoryBadge } from "@/components/shared/category-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
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
  onDelete,
  onEdit,
}: CustomBudgetCardProps) {
  const { baseCurrency } = useCurrency();
  const { t, tc, locale } = useLocale();
  const remaining = resolvedAmount - spent;
  const ratio = resolvedAmount > 0 ? spent / resolvedAmount : 0;
  const percentage = ratio * 100;
  const cappedPercentage = Math.min(percentage, 100);
  const tone = resolveBudgetUsageTone(ratio);
  const usageColor = budgetUsageColorForRatio(ratio);
  const band = BUDGET_USAGE_BANDS.find((b) => b.tone === tone);
  const statusLabel =
    locale === "es" ? band?.labelEs ?? "" : band?.labelEn ?? "";

  const categories = budget.custom_budget_categories.map((c) => c.categories);

  return (
    <div className="group rounded-lg border bg-card p-4 shadow-sm md:rounded-xl md:p-5 md:shadow-1">
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

      <div className="mt-3 grid gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">{t("Target", "Objetivo")}</p>
          <p className="mt-2 font-mono text-base font-semibold">
            {resolvedAmount > 0
              ? formatCurrency(resolvedAmount, baseCurrency)
              : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">{t("Spent", "Gastado")}</p>
          <p className="mt-2 font-mono text-base font-semibold text-foreground">
            {formatCurrency(spent, baseCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <p className="label-caps">{t("Remaining", "Restante")}</p>
          <p
            className="mt-2 font-mono text-base font-semibold"
            style={{ color: usageColor }}
          >
            {resolvedAmount > 0
              ? formatCurrency(Math.abs(remaining), baseCurrency)
              : "--"}
          </p>
        </div>
      </div>

      {resolvedAmount > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-current/10 bg-secondary/60"
              style={{ color: usageColor }}
            >
              {t(
                `${percentage.toFixed(0)}% used`,
                `${percentage.toFixed(0)}% usado`
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {statusLabel ||
                (remaining >= 0
                  ? t("Within budget", "Dentro del presupuesto")
                  : t("Overspent", "Excedido"))}
            </span>
          </div>
          <Progress
            value={cappedPercentage}
            className="gap-0 [&_[data-slot=progress-indicator]]:bg-[var(--budget-usage)]"
            style={
              {
                "--budget-usage": usageColor,
              } as CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}
