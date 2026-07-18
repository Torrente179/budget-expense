"use client";

import { useMemo } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/category-badge";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Equal,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total_amount: number;
  expense_count: number;
}

interface BudgetItem {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  };
}

interface MonthlyReportProps {
  totalSpent: number;
  totalIncome: number;
  previousMonthTotal: number;
  categoryBreakdown: CategoryBreakdownItem[];
  budgets: BudgetItem[];
  onCategoryClick?: (categoryId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MonthlyReport({
  totalSpent,
  totalIncome,
  previousMonthTotal,
  categoryBreakdown,
  budgets,
  onCategoryClick,
}: MonthlyReportProps) {
  const { baseCurrency, convert } = useCurrency();
  const { t, tc } = useLocale();

  /* Sort categories by amount descending */
  const sortedCategories = useMemo(
    () => [...categoryBreakdown].sort((a, b) => b.total_amount - a.total_amount),
    [categoryBreakdown]
  );

  const MAX_VISIBLE_CATEGORIES = 5;
  const visibleCategories = sortedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCategories = sortedCategories.slice(MAX_VISIBLE_CATEGORIES);
  const hiddenTotal = hiddenCategories.reduce((sum, c) => sum + c.total_amount, 0);

  const topCategory = sortedCategories[0] ?? null;
  const maxCategoryAmount = topCategory?.total_amount ?? 1;

  /* Budget lookup by category_id */
  const budgetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of budgets) {
      map.set(b.category_id, convert(b.amount, b.currency));
    }
    return map;
  }, [budgets, convert]);

  /* Month-over-month change */
  const monthChange = useMemo(() => {
    if (previousMonthTotal === 0) return { delta: 0, percent: 0, direction: "neutral" as const };
    const delta = totalSpent - previousMonthTotal;
    const percent = (delta / previousMonthTotal) * 100;
    return {
      delta,
      percent,
      direction: delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("neutral" as const),
    };
  }, [totalSpent, previousMonthTotal]);

  /* Auto-generated insights */
  const insights = useMemo(() => {
    const items: string[] = [];

    if (totalIncome > 0 && totalSpent > 0) {
      const savingsRate = ((totalIncome - totalSpent) / totalIncome) * 100;
      if (savingsRate > 20) {
        items.push(
          t(
            `You're saving ${savingsRate.toFixed(0)}% of your income — above the recommended 20% benchmark.`,
            `Estás ahorrando el ${savingsRate.toFixed(0)}% de tu ingreso — por encima del 20% recomendado.`
          )
        );
      } else if (savingsRate > 0) {
        items.push(
          t(
            `Savings rate is ${savingsRate.toFixed(0)}%. Consider automating savings to reach the 20% benchmark.`,
            `Tu tasa de ahorro es del ${savingsRate.toFixed(0)}%. Considera automatizar el ahorro para alcanzar el 20%.`
          )
        );
      } else {
        items.push(
          t(
            "Spending exceeds income this month. Review discretionary categories for potential adjustments.",
            "El gasto supera los ingresos este mes. Revisa categorías discrecionales para posibles ajustes."
          )
        );
      }
    }

    if (topCategory && totalSpent > 0) {
      const topPercent = (topCategory.total_amount / totalSpent) * 100;
      const topCategoryName = tc(topCategory.category_name);
      if (topPercent > 40) {
        items.push(
          t(
            `${topCategoryName} represents ${topPercent.toFixed(0)}% of total spending — review if this aligns with your priorities.`,
            `${topCategoryName} representa el ${topPercent.toFixed(0)}% del gasto total — revisa si esto se alinea con tus prioridades.`
          )
        );
      }
    }

    if (monthChange.direction === "up" && monthChange.percent > 15) {
      items.push(
        t(
          `Spending is up ${monthChange.percent.toFixed(0)}% vs last month. Check for one-time expenses or lifestyle creep.`,
          `El gasto subió ${monthChange.percent.toFixed(0)}% vs el mes pasado. Verifica gastos únicos o inflación de estilo de vida.`
        )
      );
    } else if (monthChange.direction === "down" && Math.abs(monthChange.percent) > 10) {
      items.push(
        t(
          `Spending is down ${Math.abs(monthChange.percent).toFixed(0)}% vs last month — good progress.`,
          `El gasto bajó ${Math.abs(monthChange.percent).toFixed(0)}% vs el mes pasado — buen progreso.`
        )
      );
    }

    /* Check for over-budget categories */
    let overBudgetCount = 0;
    for (const cat of sortedCategories) {
      const budget = budgetMap.get(cat.category_id);
      if (budget && cat.total_amount > budget) overBudgetCount++;
    }
    if (overBudgetCount > 0) {
      items.push(
        t(
          `${overBudgetCount} categor${overBudgetCount !== 1 ? "ies" : "y"} exceeded their envelope this month.`,
          `${overBudgetCount} categoría${overBudgetCount !== 1 ? "s" : ""} excedió su sobre este mes.`
        )
      );
    }

    return items;
  }, [totalSpent, totalIncome, topCategory, monthChange, sortedCategories, budgetMap, t, tc]);

  if (sortedCategories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="bg-card">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-secondary/70 text-foreground">
                {t("Monthly report", "Reporte mensual")}
              </Badge>
              <CardTitle className="font-heading text-title font-semibold leading-none tracking-tight md:text-display">
                {t("Spending analysis", "Análisis de gastos")}
              </CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Month-over-month */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
              <p className="label-caps">
                {t("This month", "Este mes")}
              </p>
              <p className="mt-2 font-mono text-base font-semibold text-negative md:text-lg">
                {formatCurrency(totalSpent, baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
              <p className="label-caps">
                {t("Last month", "Mes pasado")}
              </p>
              <p className="mt-2 font-mono text-base font-semibold text-negative md:text-lg">
                {formatCurrency(previousMonthTotal, baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
              <p className="label-caps">
                {t("Change", "Cambio")}
              </p>
              <div className="mt-2 flex items-center gap-1">
                {monthChange.direction === "up" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-negative" />
                ) : monthChange.direction === "down" ? (
                  <ArrowDown className="h-3.5 w-3.5 text-positive" />
                ) : (
                  <Equal className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span
                  className={`font-mono text-base font-semibold md:text-lg ${
                    monthChange.direction === "up"
                      ? "text-negative"
                      : monthChange.direction === "down"
                        ? "text-positive"
                        : "text-foreground"
                  }`}
                >
                  {monthChange.percent !== 0
                    ? `${monthChange.percent > 0 ? "+" : ""}${monthChange.percent.toFixed(0)}%`
                    : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Category spending bars */}
          <div className="space-y-2">
            <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
              {t("Spending by category", "Gasto por categoría")}
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
            {visibleCategories.map((cat, index) => {
              const budget = budgetMap.get(cat.category_id);
              const barPercent = maxCategoryAmount > 0 ? (cat.total_amount / maxCategoryAmount) * 100 : 0;
              const overBudget = budget !== undefined && cat.total_amount > budget;

              return (
                <motion.div
                  key={cat.category_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.03,
                    duration: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  role={onCategoryClick ? "button" : undefined}
                  tabIndex={onCategoryClick ? 0 : undefined}
                  onClick={onCategoryClick ? () => onCategoryClick(cat.category_id) : undefined}
                  onKeyDown={onCategoryClick ? (e) => { if (e.key === "Enter") onCategoryClick(cat.category_id); } : undefined}
                  className={`rounded-xl border border-border/70 bg-secondary/30 p-3${onCategoryClick ? " cursor-pointer transition-colors hover:bg-secondary/50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon
                      icon={cat.category_icon}
                      color={cat.category_color}
                      className="h-7 w-7 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {tc(cat.category_name)}
                        </p>
                        <div className="flex items-center gap-2">
                          {overBudget && (
                            <Badge
                              variant="outline"
                              className="border-danger/20 bg-danger-subtle text-label text-danger"
                            >
                              {t("Over", "Excedido")}
                            </Badge>
                          )}
                          <span className="shrink-0 font-mono text-sm font-medium text-negative">
                            {formatCurrency(cat.total_amount, baseCurrency)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${barPercent}%`,
                              backgroundColor: cat.category_color,
                            }}
                          />
                        </div>
                        {budget !== undefined && (
                          <span className="text-label text-muted-foreground">
                            / {formatCurrency(budget, baseCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {cat.expense_count} {t("transaction", "transacci")}{cat.expense_count !== 1 ? t("s", "ones") : t("", "ón")}
                    </span>
                    {totalSpent > 0 && (
                      <span>
                        {((cat.total_amount / totalSpent) * 100).toFixed(0)}% {t("of total", "del total")}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
            {hiddenCategories.length > 0 && (
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-muted-foreground">
                <span>
                  +{hiddenCategories.length} {t("more categories", "categorías más")}
                </span>
                <span className="font-mono">
                  {formatCurrency(hiddenTotal, baseCurrency)}
                </span>
              </div>
            )}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
              <p className="flex items-center gap-2 text-label font-medium uppercase tracking-widest text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5" />
                {t("Insights", "Observaciones")}
              </p>
              <ul className="mt-3 space-y-2">
                {insights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm leading-6 text-foreground/80"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
