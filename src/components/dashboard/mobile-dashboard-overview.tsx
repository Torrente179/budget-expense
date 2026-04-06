"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getDaysInMonth } from "date-fns";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  CandlestickChart,
  PiggyBank,
  Wallet,
} from "lucide-react";

interface MobileDashboardOverviewProps {
  totalIncome: number;
  totalSpent: number;
  availableBalance: number;
  totalBudget: number;
  previousMonthTotal: number;
  expenseCount: number;
  topCategory: { name: string; amount: number } | null;
  dailySpending: { date: string; amount: number }[];
  month: number;
  year: number;
}

export function MobileDashboardOverview({
  totalIncome,
  totalSpent,
  availableBalance,
  totalBudget,
  previousMonthTotal,
  expenseCount,
  topCategory,
  dailySpending,
  month,
  year,
}: MobileDashboardOverviewProps) {
  const { baseCurrency } = useCurrency();
  const { t, intlLocale } = useLocale();

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month - 1)),
    [intlLocale, month, year]
  );

  const chartData = useMemo(() => {
    const spendMap = new Map(dailySpending.map((item) => [item.date, item.amount]));
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
        daily: spendMap.get(date) ?? 0,
      };
    }).reduce<{ day: number; daily: number; cumulative: number }[]>(
      (acc, point) => {
        const previousTotal = acc[acc.length - 1]?.cumulative ?? 0;
        acc.push({
          ...point,
          cumulative: previousTotal - point.daily,
        });
        return acc;
      },
      []
    );
  }, [dailySpending, month, year]);

  const chartSeries = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }

    if (chartData.length === 1) {
      const singlePoint = chartData[0];
      return [
        { ...singlePoint, day: Math.max(singlePoint.day - 1, 0), daily: 0, cumulative: 0 },
        singlePoint,
      ];
    }

    return chartData;
  }, [chartData]);

  const weeklyChange = useMemo(() => {
    const currentWeek = chartData
      .slice(-7)
      .reduce((sum, point) => sum + point.daily, 0);
    const previousWeek = chartData
      .slice(-14, -7)
      .reduce((sum, point) => sum + point.daily, 0);

    if (previousWeek <= 0) {
      return null;
    }

    return ((currentWeek - previousWeek) / previousWeek) * 100;
  }, [chartData]);

  const monthChange =
    previousMonthTotal > 0
      ? ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  const hasBudget = totalBudget > 0;
  const spentPercent = hasBudget ? (totalSpent / totalBudget) * 100 : 0;
  const progressWidth = hasBudget ? Math.min(Math.max(spentPercent, 2), 100) : 0;

  const quickActions = [
    {
      href: "/budgets",
      label: t("Budget", "Presupuesto"),
      icon: PiggyBank,
    },
    {
      href: "/movimientos",
      label: t("Movements", "Movimientos"),
      icon: ArrowUpDown,
    },
    {
      href: "/investments",
      label: t("Invest", "Invertir"),
      icon: CandlestickChart,
    },
  ];

  const metricTiles = [
    {
      id: "spent",
      label: t("Expenses", "Gastos"),
      value: formatCurrency(totalSpent, baseCurrency),
    },
    {
      id: "income",
      label: t("Income", "Ingresos"),
      value: formatCurrency(totalIncome, baseCurrency),
    },
    {
      id: "total",
      label: t("Total", "Total"),
      value: formatCurrency(availableBalance, baseCurrency),
    },
  ];

  const movementSummaryLabel = t(
    `${expenseCount} movement${expenseCount === 1 ? "" : "s"} registered this month`,
    `${expenseCount} movimiento${expenseCount === 1 ? "" : "s"} registrado${expenseCount === 1 ? "" : "s"} este mes`
  );

  return (
    <div className="space-y-4 md:hidden">
      <Card className="border-border/80 bg-card/96">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-muted-foreground">
                {t("Available now", "Disponible ahora")}
              </p>
              <p
                className={cn(
                  "font-heading text-[2.45rem] font-semibold leading-none tracking-[-0.05em]",
                  availableBalance < 0 && "text-destructive"
                )}
              >
                {formatCurrency(availableBalance, baseCurrency)}
              </p>
              <p className="text-xs text-muted-foreground">{monthLabel}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-[1.1rem] border border-border/65 bg-secondary/25 p-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              {metricTiles.map((tile) => (
                <div
                  key={tile.id}
                  className="flex min-h-[74px] flex-col justify-between rounded-[0.9rem] border border-border/85 bg-card/80 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_14px_26px_-20px_rgba(0,0,0,0.95)]"
                >
                  <p className="text-[0.56rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {tile.label}
                  </p>
                  <p className="font-mono text-[1.02rem] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-[1rem] border border-border/70 bg-secondary/45 px-2 py-2.5 text-center"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border/70">
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-[0.66rem] font-medium tracking-tight text-muted-foreground">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-[1rem] border border-border/70 bg-secondary/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-foreground">
                {t("Budget pace", "Ritmo del presupuesto")}
              </p>
              {monthChange !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-6 rounded-full px-2 text-[0.65rem]",
                    monthChange <= 0
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  )}
                >
                  {monthChange <= 0 ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" />
                  )}
                  {Math.abs(monthChange).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  hasBudget && spentPercent <= 100
                    ? "bg-emerald-400/80"
                    : "bg-destructive/85"
                )}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {hasBudget
                ? spentPercent <= 100
                  ? t(
                      `${spentPercent.toFixed(0)}% of this month's limit used`,
                      `${spentPercent.toFixed(0)}% del límite mensual usado`
                    )
                  : t(
                      `${(spentPercent - 100).toFixed(0)}% over this month's limit`,
                      `${(spentPercent - 100).toFixed(0)}% por encima del límite mensual`
                    )
                : t(
                    "Set a monthly budget to activate pacing alerts",
                    "Define un presupuesto mensual para activar alertas de ritmo"
                  )}
            </p>
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
                {t("Cumulative impact", "Impacto acumulado")}
              </CardTitle>
            </div>
            {weeklyChange !== null ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  weeklyChange <= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                {weeklyChange > 0 ? "+" : ""}
                {weeklyChange.toFixed(1)}%
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
                    <linearGradient id="mobileSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="var(--chart-1)"
                    strokeWidth={2.2}
                    fill="url(#mobileSpendGrad)"
                    dot={false}
                    activeDot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-[1rem] bg-secondary/45" />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-secondary/35 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              {t("Top category", "Categoría principal")}
            </p>
            <p className="text-right text-xs font-medium text-foreground">
              {topCategory
                ? `${topCategory.name} · ${formatCurrency(topCategory.amount, baseCurrency)}`
                : t("No activity yet", "Sin actividad todavía")}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {movementSummaryLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
