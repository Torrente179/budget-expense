"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  BookOpenText,
  TrendingUp,
} from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useCustomBudgets } from "@/hooks/use-custom-budgets";
import { useMonthlyBudgetPlan } from "@/hooks/use-monthly-budget-plan";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import {
  calculateCustomBudgetSpending,
  resolveCustomBudgetAmount,
} from "@/lib/budgeting";
import { detectAnomalies } from "@/lib/insights/anomalies";
import { useMonth } from "@/providers/month-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { StatCard } from "@/components/patterns/stat-card";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { StatusTag } from "@/components/patterns/status-tag";
import { MonthPicker } from "@/components/shared/month-picker";
import { CategoryIcon } from "@/components/shared/category-badge";
import { MonthlyReport } from "@/components/insights/monthly-report";
import { GivingInsights } from "@/components/insights/giving-insights";
import { DeferredInsightsTrendCharts } from "@/components/insights/deferred-insights-trend-charts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDaysInMonth, parseISO } from "date-fns";

export function InsightsScreen() {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const { month, year, isCurrentMonth, setMonthYear } = useMonth();
  const router = useRouter();

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { incomes } = useIncomes({ month, year });
  const { customBudgets } = useCustomBudgets({ month, year });
  const { plan } = useMonthlyBudgetPlan({ month, year });
  const { insights } = useHouseholdInsights();

  const incomeAmount = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      router.push(
        `/insights/categories/${categoryId}?month=${month}&year=${year}&from=insights`
      );
    },
    [router, month, year]
  );

  const handleDayClick = useCallback(
    (day: number) => {
      router.push(`/insights/calendar?day=${day}`);
    },
    [router]
  );

  const handleMonthClick = useCallback(
    (monthKey: string) => {
      const [nextYear, nextMonth] = monthKey.split("-").map(Number);
      if (!nextYear || !nextMonth) return;
      setMonthYear(nextMonth, nextYear);
      router.push("/movements?tab=expenses");
    },
    [router, setMonthYear]
  );

  /* Key ratios */
  const savingsRate =
    summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalSpent) / summary.totalIncome) * 100
      : null;
  const expenseRatio =
    summary.totalIncome > 0
      ? (summary.totalSpent / summary.totalIncome) * 100
      : null;
  const budgetUsage =
    summary.totalBudget > 0
      ? (summary.totalSpent / summary.totalBudget) * 100
      : null;

  /* 12-month spending trend */
  const trendData = useMemo(() => {
    if (!insights) return [];
    const byMonth = new Map<string, number>();
    for (const row of insights.categoryMonthTotals) {
      byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.total);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, total]) => ({
        month: monthKey,
        label: new Intl.DateTimeFormat(intlLocale, {
          month: "short",
        }).format(new Date(`${monthKey}-01T00:00:00`)),
        total,
      }));
  }, [insights, intlLocale]);

  /* Daily spend for the selected month (current month stops at today) */
  const dailySpendData = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const endDay = isCurrentMonth
      ? Math.min(new Date().getDate(), daysInMonth)
      : daysInMonth;
    const spentByDate = new Map(
      summary.dailySpending.map((day) => [day.date, day.amount])
    );
    return Array.from({ length: endDay }, (_, i) => i + 1).map((day) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return {
        day,
        label: new Intl.DateTimeFormat(intlLocale, {
          day: "numeric",
        }).format(parseISO(dateStr)),
        total: spentByDate.get(dateStr) ?? 0,
      };
    });
  }, [summary.dailySpending, month, year, isCurrentMonth, intlLocale]);

  /* Custom budget utilization (same model as Budget tab / Home) */
  const budgetUtilization = useMemo(() => {
    if (customBudgets.length === 0) return [];
    return customBudgets
      .map((budget) => {
        const categoryIds = budget.custom_budget_categories.map(
          (link) => link.category_id
        );
        const budgetAmount = resolveCustomBudgetAmount(
          budget,
          incomeAmount,
          convert
        );
        const spent = calculateCustomBudgetSpending(
          categoryIds,
          expenses,
          convert
        );
        const primary = budget.custom_budget_categories[0]?.categories;
        return {
          id: budget.id,
          name: budget.name,
          categoryId: primary?.id ?? null,
          categoryIcon: primary?.icon ?? "more-horizontal",
          categoryColor: primary?.color ?? "var(--muted-foreground)",
          budgetAmount,
          spent,
          ratio: budgetAmount > 0 ? spent / budgetAmount : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [customBudgets, expenses, incomeAmount, convert]);

  /* Income sources */
  const incomeBySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const income of incomes) {
      map.set(
        income.source,
        (map.get(income.source) ?? 0) + convert(income.amount, income.currency)
      );
    }
    return Array.from(map.entries())
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total);
  }, [incomes, convert]);

  /* Anomalies */
  const anomalies = useMemo(() => {
    if (!insights) return [];
    return detectAnomalies(
      insights.categoryMonthTotals,
      format(new Date(), "yyyy-MM")
    ).slice(0, 4);
  }, [insights]);

  /* Giving component input */
  const givingExpenses = useMemo(
    () =>
      expenses.map((expense) => ({
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        categoryName: expense.categories?.name ?? "Other",
        categoryIcon: expense.categories?.icon ?? "more-horizontal",
        categoryColor: expense.categories?.color ?? "var(--muted-foreground)",
        category_id: expense.category_id,
        classification: expense.categories?.classification,
      })),
    [expenses]
  );

  return (
    <Screen
      title={t("Insights", "Análisis")}
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Ratios */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={t("Savings rate", "Tasa de ahorro")}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—"}
                </span>
              }
              detail={
                savingsRate !== null
                  ? savingsRate >= 20
                    ? t("Above 20% target", "Sobre la meta del 20%")
                    : t("Below 20% target", "Debajo de la meta del 20%")
                  : t("No income this month", "Sin ingresos este mes")
              }
            />
            <StatCard
              label={t("Expense ratio", "Ratio de gastos")}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {expenseRatio !== null ? `${expenseRatio.toFixed(0)}%` : "—"}
                </span>
              }
              detail={t("of income spent", "del ingreso gastado")}
            />
            <StatCard
              label={t("Budget usage", "Uso del presupuesto")}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {budgetUsage !== null ? `${budgetUsage.toFixed(0)}%` : "—"}
                </span>
              }
              detail={
                budgetUsage !== null
                  ? t("of pool consumed", "del fondo consumido")
                  : t("No budget set", "Sin presupuesto")
              }
            />
            <StatCard
              label={t("Transactions", "Transacciones")}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {summary.expenseCount}
                </span>
              }
              detail={t("this month", "este mes")}
            />
          </div>

          {/* Three pillars (trailing 12M) */}
          {insights && insights.givingRate !== null && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Last 12 months", "Últimos 12 meses")}
                  title={t(
                    "Giving · Spending · Saving",
                    "Dar · Gastar · Ahorrar"
                  )}
                  description={t(
                    `Giving target ${insights.titheTargetPercent}% · the three sum to 100% of income`,
                    `Meta de dar ${insights.titheTargetPercent}% · los tres suman el 100% del ingreso`
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
                  <div
                    style={{
                      width: `${(insights.givingRate ?? 0) * 100}%`,
                      backgroundColor: "var(--chart-1)",
                    }}
                  />
                  <div
                    style={{
                      width: `${(insights.spendingRate ?? 0) * 100}%`,
                      backgroundColor: "var(--chart-2)",
                    }}
                  />
                  <div
                    style={{
                      width: `${(insights.savingsRate ?? 0) * 100}%`,
                      backgroundColor: "var(--chart-3)",
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {(
                    [
                      [t("Giving", "Dar"), insights.givingRate, "var(--chart-1)"],
                      [
                        t("Spending", "Gastar"),
                        insights.spendingRate,
                        "var(--chart-2)",
                      ],
                      [
                        t("Saving", "Ahorrar"),
                        insights.savingsRate,
                        "var(--chart-3)",
                      ],
                    ] as const
                  ).map(([label, rate, color]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 text-caption text-muted-foreground"
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {label}{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {rate !== null ? `${(rate * 100).toFixed(1)}%` : "—"}
                      </span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          <DeferredInsightsTrendCharts
            trendData={trendData}
            dailySpendData={dailySpendData}
            intlLocale={intlLocale}
            baseCurrency={baseCurrency}
            onMonthClick={handleMonthClick}
            onDayClick={handleDayClick}
          />

          {/* Budget utilization */}
          {budgetUtilization.length > 0 && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Against plan", "Frente al plan")}
                  title={t("Budget use", "Uso del presupuesto")}
                  description={t(
                    `${budgetUtilization.filter((b) => b.ratio > 1).length} of ${budgetUtilization.length} budgets over the limit`,
                    `${budgetUtilization.filter((b) => b.ratio > 1).length} de ${budgetUtilization.length} presupuestos por encima del límite`
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-1">
                {budgetUtilization.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      if (row.categoryId) {
                        handleCategoryClick(row.categoryId);
                      } else {
                        router.push("/budget");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <CategoryIcon
                      icon={row.categoryIcon}
                      color={row.categoryColor}
                      className="h-8 w-8 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-body font-medium">
                            {row.name}
                          </span>
                          {row.ratio > 1 && (
                            <StatusTag tone="danger" className="shrink-0">
                              {t("Over", "Excedido")}
                            </StatusTag>
                          )}
                        </span>
                        <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                          <span className="text-foreground">
                            {formatCurrency(row.spent, baseCurrency)}
                          </span>
                          {" / "}
                          {formatCurrency(row.budgetAmount, baseCurrency)}
                        </span>
                      </div>
                      <ProgressMeter ratio={row.ratio} className="mt-1.5" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Heads up", "Ojo")}
                  title={t("Unusual spending", "Gasto raro")}
                />
              </CardHeader>
              <CardContent className="space-y-1">
                {anomalies.map((anomaly) => (
                  <button
                    key={anomaly.categoryId}
                    type="button"
                    onClick={() => handleCategoryClick(anomaly.categoryId)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium">
                        {tc(anomaly.categoryName)}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        <span className="font-mono tabular-nums text-foreground">
                          {formatCurrency(anomaly.currentTotal, baseCurrency)}
                        </span>{" "}
                        {t(
                          `this month vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} typical`,
                          `este mes vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} habitual`
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Monthly report + Giving */}
          <MonthlyReport
            totalSpent={summary.totalSpent}
            totalIncome={summary.totalIncome}
            previousMonthTotal={summary.previousMonthTotal}
            categoryBreakdown={summary.categoryBreakdown}
            budgets={[]}
            overBudgetCount={
              budgetUtilization.filter((row) => row.ratio > 1).length
            }
            onCategoryClick={handleCategoryClick}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <GivingInsights
              expenses={givingExpenses}
              totalIncome={summary.totalIncome}
            />

            {incomeBySource.length > 0 && (
              <Card>
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("Income", "Ingresos")}
                    title={t("Where it came from", "De dónde vino")}
                    action={
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-subtle text-success">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </div>
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-1">
                  {incomeBySource.map((source) => {
                    const maxAmount = incomeBySource[0]?.total ?? 1;
                    const share =
                      summary.totalIncome > 0
                        ? (source.total / summary.totalIncome) * 100
                        : 0;
                    return (
                      <div key={source.source} className="px-2 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success-subtle">
                              <ArrowDownLeft className="h-4 w-4 text-success" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-body font-medium">
                                {source.source}
                              </p>
                              {summary.totalIncome > 0 && (
                                <p className="text-caption text-muted-foreground">
                                  {share.toFixed(0)}%{" "}
                                  {t("of income", "del ingreso")}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-body font-medium tabular-nums text-positive">
                            {formatCurrency(source.total, baseCurrency)}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-success transition-all duration-500"
                            style={{
                              width: `${(source.total / maxAmount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Wisdom footer link */}
          <Link
            href="/wisdom"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 transition-colors hover:bg-secondary"
          >
            <span className="flex items-center gap-3">
              <BookOpenText className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="text-body font-medium">
                {t("Wisdom library", "Biblioteca de sabiduría")}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </>
      )}
    </Screen>
  );
}
