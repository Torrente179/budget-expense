"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getDaysInMonth } from "date-fns";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Ellipsis,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn, formatCurrency, formatDate, getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { IncomeForm } from "@/components/incomes/income-form";

type ActivityItem = {
  id: string;
  type: "income" | "expense";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
};

export default function AvailableNowPage() {
  const { t, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  const { expenses, addExpense } = useExpenses({ month, year });
  const { incomes, addIncome } = useIncomes({ month, year });

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + convert(expense.amount, expense.currency), 0),
    [convert, expenses]
  );

  const totalIncome = useMemo(
    () => incomes.reduce((sum, income) => sum + convert(income.amount, income.currency), 0),
    [convert, incomes]
  );

  const availableTotal = totalIncome - totalSpent;

  const activity = useMemo<ActivityItem[]>(() => {
    const expenseItems: ActivityItem[] = expenses.map((expense) => ({
      id: expense.id,
      type: "expense",
      title: expense.description || expense.categories.name,
      subtitle: expense.categories.name,
      amount: -convert(expense.amount, expense.currency),
      date: expense.date,
    }));

    const incomeItems: ActivityItem[] = incomes.map((income) => ({
      id: income.id,
      type: "income",
      title: income.source,
      subtitle: income.description || t("Income movement", "Movimiento de ingreso"),
      amount: convert(income.amount, income.currency),
      date: income.date,
    }));

    return [...incomeItems, ...expenseItems]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 8);
  }, [convert, expenses, incomes, t]);

  const chartData = useMemo(() => {
    const netByDate = new Map<string, number>();

    incomes.forEach((income) => {
      const converted = convert(income.amount, income.currency);
      netByDate.set(income.date, (netByDate.get(income.date) ?? 0) + converted);
    });

    expenses.forEach((expense) => {
      const converted = convert(expense.amount, expense.currency);
      netByDate.set(expense.date, (netByDate.get(expense.date) ?? 0) - converted);
    });

    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;
    const visibleDays = isCurrentMonth
      ? now.getDate()
      : getDaysInMonth(new Date(year, month - 1));

    return Array.from({ length: visibleDays }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      return {
        day,
        net: netByDate.get(date) ?? 0,
      };
    }).reduce<{ day: number; net: number; cumulative: number }[]>(
      (acc, point) => {
        const previous = acc[acc.length - 1]?.cumulative ?? 0;
        acc.push({
          ...point,
          cumulative: previous + point.net,
        });
        return acc;
      },
      []
    );
  }, [convert, expenses, incomes, month, year]);

  const chartSeries = useMemo(() => {
    if (chartData.length === 0) return [];
    if (chartData.length === 1) {
      const singlePoint = chartData[0];
      return [
        { ...singlePoint, day: Math.max(singlePoint.day - 1, 0), net: 0, cumulative: 0 },
        singlePoint,
      ];
    }
    return chartData;
  }, [chartData]);

  const weeklyNetChange = useMemo(() => {
    const currentWeek = chartData
      .slice(-7)
      .reduce((sum, point) => sum + point.net, 0);
    const previousWeek = chartData
      .slice(-14, -7)
      .reduce((sum, point) => sum + point.net, 0);

    if (previousWeek === 0) return null;
    return ((currentWeek - previousWeek) / Math.abs(previousWeek)) * 100;
  }, [chartData]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month - 1)),
    [intlLocale, month, year]
  );

  const highlights = [
    {
      id: "income",
      label: t("Income", "Ingresos"),
      value: formatCurrency(totalIncome, baseCurrency),
      icon: TrendingUp,
      tone: "text-emerald-300",
    },
    {
      id: "expense",
      label: t("Expenses", "Gastos"),
      value: formatCurrency(totalSpent, baseCurrency),
      icon: Receipt,
      tone: "text-destructive",
    },
    {
      id: "total",
      label: t("Total", "Total"),
      value: formatCurrency(availableTotal, baseCurrency),
      icon: Wallet,
      tone: availableTotal >= 0 ? "text-foreground" : "text-destructive",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      <PageHeader
        title={t("Total", "Total")}
        description={t(
          "Income and expenses merged into a single available total.",
          "Ingresos y gastos combinados en un solo total disponible."
        )}
      >
        <MonthPicker
          month={month}
          year={year}
          onChange={(nextMonth, nextYear) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />
      </PageHeader>

      <div className="space-y-4 md:hidden">
        <Card className="overflow-hidden border-border/80 bg-card/96">
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-muted-foreground">
                  {t("Available now", "Disponible ahora")}
                </p>
                <p
                  className={cn(
                    "font-heading text-[2.55rem] font-semibold leading-none tracking-[-0.05em]",
                    availableTotal < 0 && "text-destructive"
                  )}
                >
                  {formatCurrency(availableTotal, baseCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">{monthLabel}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <IncomeForm
                onSubmit={addIncome}
                trigger={
                  <Button
                    variant="ghost"
                    className="h-auto flex-col gap-2 rounded-[1rem] border border-border/70 bg-secondary/45 px-2 py-2.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border/70">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="text-[0.66rem] font-medium tracking-tight text-muted-foreground">
                      {t("Receive", "Ingreso")}
                    </span>
                  </Button>
                }
              />
              <ExpenseForm
                onSubmit={addExpense}
                trigger={
                  <Button
                    variant="ghost"
                    className="h-auto flex-col gap-2 rounded-[1rem] border border-border/70 bg-secondary/45 px-2 py-2.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border/70">
                      <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="text-[0.66rem] font-medium tracking-tight text-muted-foreground">
                      {t("Spend", "Gasto")}
                    </span>
                  </Button>
                }
              />
              <Link href="/budgets" className="flex flex-col items-center gap-2 rounded-[1rem] border border-border/70 bg-secondary/45 px-2 py-2.5 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border/70">
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-[0.66rem] font-medium tracking-tight text-muted-foreground">
                  {t("Budget", "Presupuesto")}
                </span>
              </Link>
              <Link href="/dashboard" className="flex flex-col items-center gap-2 rounded-[1rem] border border-border/70 bg-secondary/45 px-2 py-2.5 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border/70">
                  <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-[0.66rem] font-medium tracking-tight text-muted-foreground">
                  {t("More", "Más")}
                </span>
              </Link>
            </div>

            <div className="rounded-[1.1rem] border border-border/65 bg-secondary/25 p-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {highlights.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-h-[74px] flex-col justify-between rounded-[0.9rem] border border-border/85 bg-card/80 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_14px_26px_-20px_rgba(0,0,0,0.95)]"
                  >
                    <p className="text-[0.56rem] uppercase tracking-[0.14em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={cn("font-mono text-[1.02rem] font-semibold leading-none tracking-tight tabular-nums", item.tone)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/96">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-muted-foreground">
                  {t("Analytics", "Analítica")}
                </p>
                <CardTitle className="mt-2 font-heading text-[1.35rem] font-semibold tracking-tight">
                  {t("Cumulative balance", "Balance acumulado")}
                </CardTitle>
              </div>
              {weeklyNetChange !== null ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs",
                    weeklyNetChange >= 0
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  )}
                >
                  {weeklyNetChange > 0 ? "+" : ""}
                  {weeklyNetChange.toFixed(1)}%
                  {t(" this week", " esta semana")}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {t("Building baseline", "Construyendo base")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[140px]">
              {chartSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={140}>
                  <AreaChart data={chartSeries}>
                    <defs>
                      <linearGradient id="availableNetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="var(--chart-1)"
                      strokeWidth={2.2}
                      fill="url(#availableNetGrad)"
                      dot={false}
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-[1rem] bg-secondary/45" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/96">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-[1.35rem] font-semibold tracking-tight">
                {t("Recent activity", "Actividad reciente")}
              </CardTitle>
              <Link href="/expenses" className="text-sm text-muted-foreground">
                {t("See all", "Ver todo")}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pb-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("No activity this month", "Sin actividad este mes")}
              </p>
            ) : (
              activity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-secondary/35 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.subtitle} • {formatDate(item.date, "MMM d")}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-mono text-sm font-semibold tabular-nums",
                      item.amount >= 0 ? "text-emerald-300" : "text-destructive"
                    )}
                  >
                    {item.amount >= 0 ? "+" : ""}
                    {formatCurrency(item.amount, baseCurrency)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/96">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-[1.35rem] font-semibold tracking-tight">
              {t("Expense list", "Lista de gastos")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pb-4">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("No expenses this month", "No hay gastos este mes")}
              </p>
            ) : (
              expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-secondary/35 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {expense.description || expense.categories.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.categories.name} • {formatDate(expense.date, "MMM d")}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-destructive tabular-nums">
                    -{formatCurrency(convert(expense.amount, expense.currency), baseCurrency)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.id} className="border-border/80 bg-card/96">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className={cn("mt-3 font-heading text-[2.05rem] font-semibold leading-none tracking-[-0.045em]", item.tone)}>
                    {item.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden border-border/80 bg-card/96 md:block">
        <CardHeader>
          <CardTitle>{t("Expense list", "Lista de gastos")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("No expenses this month", "No hay gastos este mes")}
            </p>
          ) : (
            expenses.slice(0, 10).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-secondary/35 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {expense.description || expense.categories.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {expense.categories.name} • {formatDate(expense.date, "MMM d")}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold text-destructive tabular-nums">
                  -{formatCurrency(convert(expense.amount, expense.currency), baseCurrency)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
