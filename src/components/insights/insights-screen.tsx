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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useBudgets } from "@/hooks/use-budgets";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
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
import { ChartCard } from "@/components/charts/chart-card";
import {
  ChartAreaGradient,
  chartAxisProps,
  chartGridProps,
  chartTooltipStyle,
  compactCurrencyTick,
  currencyTooltipFormatter,
} from "@/components/charts/chart-theme";
import { MonthPicker } from "@/components/shared/month-picker";
import { CategoryIcon } from "@/components/shared/category-badge";
import { MonthlyReport } from "@/components/insights/monthly-report";
import { GivingInsights } from "@/components/insights/giving-insights";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDaysInMonth, parseISO } from "date-fns";

export function InsightsScreen() {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const { month, year, setMonthYear } = useMonth();
  const router = useRouter();

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { incomes } = useIncomes({ month, year });
  const { budgets } = useBudgets({ month, year });
  const { insights } = useHouseholdInsights();

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      router.push(
        `/insights/categories/${categoryId}?month=${month}&year=${year}&from=insights`
      );
    },
    [router, month, year]
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

  /* Cumulative daily spend for the selected month */
  const cumulativeData = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const spentByDate = new Map(
      summary.dailySpending.map((day) => [day.date, day.amount])
    );
    let cumulative = 0;
    return Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cumulative += spentByDate.get(dateStr) ?? 0;
      return {
        label: new Intl.DateTimeFormat(intlLocale, {
          day: "numeric",
        }).format(parseISO(dateStr)),
        total: cumulative,
      };
    });
  }, [summary.dailySpending, month, year, intlLocale]);

  /* Category breakdown with proportions */
  const categoryTotal = summary.categoryBreakdown.reduce(
    (sum, row) => sum + row.total_amount,
    0
  );

  /* Envelope utilization */
  const budgetUtilization = useMemo(() => {
    if (budgets.length === 0) return [];
    const spentMap = new Map<string, number>();
    for (const expense of expenses) {
      spentMap.set(
        expense.category_id,
        (spentMap.get(expense.category_id) ?? 0) +
          convert(expense.amount, expense.currency)
      );
    }
    return budgets
      .map((budget) => {
        const budgetAmount = convert(budget.amount, budget.currency);
        const spent = spentMap.get(budget.category_id) ?? 0;
        return {
          id: budget.id,
          categoryId: budget.category_id,
          categoryName: budget.categories.name,
          categoryIcon: budget.categories.icon,
          categoryColor: budget.categories.color,
          budgetAmount,
          spent,
          ratio: budgetAmount > 0 ? spent / budgetAmount : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [budgets, expenses, convert]);

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

  const tooltipFormatter = currencyTooltipFormatter(intlLocale, baseCurrency);

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
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              eyebrow={t("Trend", "Tendencia")}
              title={t("Monthly spending, 12 months", "Gasto mensual, 12 meses")}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={trendData}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="label" {...chartAxisProps} />
                  <YAxis
                    {...chartAxisProps}
                    tickFormatter={compactCurrencyTick(intlLocale, baseCurrency)}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--chart-grid)" }}
                    formatter={(value) => [
                      tooltipFormatter(Number(value)),
                      t("Spent", "Gastado"),
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              eyebrow={t("This month", "Este mes")}
              title={t("Cumulative spending", "Gasto acumulado")}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={cumulativeData}>
                  <ChartAreaGradient id="insightsCumulative" />
                  <CartesianGrid {...chartGridProps} />
                  <XAxis
                    dataKey="label"
                    {...chartAxisProps}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    {...chartAxisProps}
                    tickFormatter={compactCurrencyTick(intlLocale, baseCurrency)}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [
                      tooltipFormatter(Number(value)),
                      t("Total", "Total"),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#insightsCumulative)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <SectionHeader
                eyebrow={t("Where it went", "A dónde fue")}
                title={t("Spending by category", "Gasto por categoría")}
              />
            </CardHeader>
            <CardContent className="space-y-1">
              {summary.categoryBreakdown.length === 0 ? (
                <p className="text-body text-muted-foreground">
                  {t("No expenses this month.", "Sin gastos este mes.")}
                </p>
              ) : (
                summary.categoryBreakdown.map((row) => (
                  <button
                    key={row.category_id}
                    type="button"
                    onClick={() => handleCategoryClick(row.category_id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <CategoryIcon
                      icon={row.category_icon}
                      color={row.category_color}
                      className="h-8 w-8 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-body font-medium">
                          {tc(row.category_name)}
                        </p>
                        <span className="shrink-0 font-mono text-body tabular-nums">
                          {formatCurrency(row.total_amount, baseCurrency)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${categoryTotal > 0 ? (row.total_amount / categoryTotal) * 100 : 0}%`,
                            backgroundColor: row.category_color,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Envelope utilization */}
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
                {budgetUtilization.map((envelope) => (
                  <button
                    key={envelope.id}
                    type="button"
                    onClick={() => handleCategoryClick(envelope.categoryId)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <CategoryIcon
                      icon={envelope.categoryIcon}
                      color={envelope.categoryColor}
                      className="h-8 w-8 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-body font-medium">
                            {tc(envelope.categoryName)}
                          </span>
                          {envelope.ratio > 1 && (
                            <StatusTag tone="danger" className="shrink-0">
                              {t("Over", "Excedido")}
                            </StatusTag>
                          )}
                        </span>
                        <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                          {formatCurrency(envelope.spent, baseCurrency)} /{" "}
                          {formatCurrency(envelope.budgetAmount, baseCurrency)}
                        </span>
                      </div>
                      <ProgressMeter ratio={envelope.ratio} className="mt-1.5" />
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
                        {t(
                          `${formatCurrency(anomaly.currentTotal, baseCurrency)} this month vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} typical`,
                          `${formatCurrency(anomaly.currentTotal, baseCurrency)} este mes vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} habitual`
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
            budgets={budgets}
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
