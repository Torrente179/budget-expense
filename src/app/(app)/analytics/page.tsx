"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { useIncomes } from "@/hooks/use-incomes";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
  getMonthName,
} from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { GivingInsights } from "@/components/dashboard/giving-insights";
import { MonthlyReport } from "@/components/dashboard/monthly-report";
import { CategoryIcon } from "@/components/shared/category-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  HandHeart,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const { locale, t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      router.push(`/analytics/category/${categoryId}?month=${month}&year=${year}`);
    },
    [router, month, year]
  );

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { incomes } = useIncomes({ month, year });
  const { budgets } = useBudgets({ month, year });

  /* Map expenses for the giving component */
  const givingExpenses = useMemo(
    () =>
      expenses.map((exp) => ({
        id: exp.id,
        amount: exp.amount,
        currency: exp.currency,
        description: exp.description,
        categoryName: (exp as any).categories?.name ?? "Other",
        categoryIcon: (exp as any).categories?.icon ?? "more-horizontal",
        categoryColor: (exp as any).categories?.color ?? "#64748b",
        category_id: exp.category_id,
      })),
    [expenses]
  );

  /* Income source breakdown */
  const incomeBySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const inc of incomes) {
      const key = inc.source;
      map.set(key, (map.get(key) ?? 0) + convert(inc.amount, inc.currency));
    }
    return Array.from(map.entries())
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total);
  }, [incomes, convert]);

  /* Budget utilization */
  const budgetUtilization = useMemo(() => {
    if (budgets.length === 0) return [];

    const spentMap = new Map<string, number>();
    for (const exp of expenses) {
      const current = spentMap.get(exp.category_id) ?? 0;
      spentMap.set(exp.category_id, current + convert(exp.amount, exp.currency));
    }

    return budgets
      .map((b) => {
        const budgetAmount = convert(b.amount, b.currency);
        const spent = spentMap.get(b.category_id) ?? 0;
        const percent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        return {
          id: b.id,
          categoryId: b.category_id,
          categoryName: b.categories.name,
          categoryIcon: b.categories.icon,
          categoryColor: b.categories.color,
          budgetAmount,
          spent,
          remaining: budgetAmount - spent,
          percent,
          over: spent > budgetAmount,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [budgets, expenses, convert]);

  /* Key ratios */
  const ratios = useMemo(() => {
    const savingsRate =
      summary.totalIncome > 0
        ? ((summary.totalIncome - summary.totalSpent) / summary.totalIncome) * 100
        : 0;
    const expenseToIncomeRatio =
      summary.totalIncome > 0
        ? (summary.totalSpent / summary.totalIncome) * 100
        : 0;
    const budgetUsage =
      summary.totalBudget > 0
        ? (summary.totalSpent / summary.totalBudget) * 100
        : 0;

    return { savingsRate, expenseToIncomeRatio, budgetUsage };
  }, [summary]);

  const monthLabel = `${getMonthName(month, locale)} ${year}`;

  return (
    <div className="space-y-5 md:space-y-8">
      <PageHeader
        title={t("Analytics", "Analítica")}
        description={t(
          "Deep view into your spending patterns, savings rate, budget performance, and giving — all in one place.",
          "Vista profunda de tus patrones de gasto, tasa de ahorro, desempeño del presupuesto y donaciones — todo en un solo lugar."
        )}
      >
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </PageHeader>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[150px] rounded-[1.75rem]" />
            ))}
          </div>
          <Skeleton className="h-[320px] rounded-[1.75rem]" />
        </div>
      ) : (
        <>
          {/* -------------------------------------------------------- */}
          {/*  Key metrics                                              */}
          {/* -------------------------------------------------------- */}

          <SummaryCards
            totalIncome={summary.totalIncome}
            totalSpent={summary.totalSpent}
            availableBalance={summary.availableBalance}
            previousMonthTotal={summary.previousMonthTotal}
            allocationPercent={summary.allocationPercent}
            hasPlan={summary.allocationPercent !== null}
          />

          {/* -------------------------------------------------------- */}
          {/*  Financial ratios (mobile-friendly row)                   */}
          {/* -------------------------------------------------------- */}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4"
            >
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("Savings rate", "Tasa de ahorro")}
              </p>
              <p className="mt-2 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {ratios.savingsRate.toFixed(1)}%
              </p>
              <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                {ratios.savingsRate >= 20
                  ? t("Above 20% target", "Sobre la meta del 20%")
                  : t("Below 20% target", "Debajo de la meta del 20%")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4"
            >
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("Expense ratio", "Ratio de gastos")}
              </p>
              <p className="mt-2 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {ratios.expenseToIncomeRatio.toFixed(0)}%
              </p>
              <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                {t("of income spent", "del ingreso gastado")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4"
            >
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("Budget usage", "Uso del presupuesto")}
              </p>
              <p className="mt-2 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {summary.totalBudget > 0 ? `${ratios.budgetUsage.toFixed(0)}%` : "--"}
              </p>
              <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                {summary.totalBudget > 0
                  ? t("of pool consumed", "del fondo consumido")
                  : t("No budget set", "Sin presupuesto")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4"
            >
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("Transactions", "Transacciones")}
              </p>
              <p className="mt-2 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {summary.expenseCount}
              </p>
              <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                {t("this month", "este mes")}
              </p>
            </motion.div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Spending chart + Category breakdown                      */}
          {/* -------------------------------------------------------- */}

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SpendingChart
                dailySpending={summary.dailySpending}
                month={month}
                year={year}
              />
            </div>
            <div className="lg:col-span-2">
              <CategoryBreakdown
                categoryBreakdown={summary.categoryBreakdown}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  Budget performance (envelope utilization)                */}
          {/* -------------------------------------------------------- */}

          {budgetUtilization.length > 0 && (
            <Card className="border-border/80 bg-card/96">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Badge variant="outline" className="bg-secondary/70 text-foreground">
                      {t("Budget performance", "Desempeño del presupuesto")}
                    </Badge>
                    <CardTitle className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                      {t("Envelope utilization", "Uso de sobres")}
                    </CardTitle>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-secondary text-muted-foreground">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(
                    `${budgetUtilization.filter((b) => b.over).length} of ${budgetUtilization.length} envelopes over budget`,
                    `${budgetUtilization.filter((b) => b.over).length} de ${budgetUtilization.length} sobres por encima del presupuesto`
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {budgetUtilization.map((b, i) => {
                  const status = b.percent >= 90 ? "danger" : b.percent >= 75 ? "warning" : "good";
                  const progressColor = {
                    good: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
                    warning: "[&_[data-slot=progress-indicator]]:bg-amber-500",
                    danger: "[&_[data-slot=progress-indicator]]:bg-red-500",
                  }[status];

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCategoryClick(b.categoryId)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCategoryClick(b.categoryId); }}
                      className="cursor-pointer rounded-xl border border-border/70 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon
                          icon={b.categoryIcon}
                          color={b.categoryColor}
                          className="h-7 w-7 rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{b.categoryName}</p>
                            <div className="flex items-center gap-2">
                              {b.over && (
                                <Badge
                                  variant="outline"
                                  className="border-red-500/20 bg-red-500/10 text-[0.6rem] text-red-600 dark:text-red-400"
                                >
                                  {t("Over", "Excedido")}
                                </Badge>
                              )}
                              <span className="shrink-0 font-mono text-xs">
                                {formatCurrency(b.spent, baseCurrency)} / {formatCurrency(b.budgetAmount, baseCurrency)}
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={Math.min(b.percent, 100)}
                            className={`mt-1.5 h-1.5 ${progressColor}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* -------------------------------------------------------- */}
          {/*  Monthly report (full width)                             */}
          {/* -------------------------------------------------------- */}

          <MonthlyReport
            totalSpent={summary.totalSpent}
            totalIncome={summary.totalIncome}
            totalBudget={summary.totalBudget}
            previousMonthTotal={summary.previousMonthTotal}
            expenseCount={summary.expenseCount}
            categoryBreakdown={summary.categoryBreakdown}
            budgets={budgets}
            onCategoryClick={handleCategoryClick}
          />

          {/* -------------------------------------------------------- */}
          {/*  Giving + Income side-by-side                            */}
          {/* -------------------------------------------------------- */}

          <div className="grid gap-4 lg:grid-cols-2">
            <GivingInsights
              expenses={givingExpenses}
              totalIncome={summary.totalIncome}
            />

            {incomeBySource.length > 0 && (
              <Card className="border-border/80 bg-card/96">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-secondary/70 text-foreground">
                        {t("Income analysis", "Análisis de ingresos")}
                      </Badge>
                      <CardTitle className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                        {t("Income sources", "Fuentes de ingreso")}
                      </CardTitle>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-secondary text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {incomeBySource.map((src, i) => {
                    const maxAmount = incomeBySource[0]?.total ?? 1;
                    const barPercent = (src.total / maxAmount) * 100;

                    return (
                      <motion.div
                        key={src.source}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-xl border border-border/70 bg-secondary/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12">
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                            <p className="truncate text-sm font-medium">{src.source}</p>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(src.total, baseCurrency)}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                        {summary.totalIncome > 0 && (
                          <p className="mt-1 text-right text-[0.65rem] text-muted-foreground">
                            {((src.total / summary.totalIncome) * 100).toFixed(0)}% {t("of total income", "del ingreso total")}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
