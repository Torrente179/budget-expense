"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { parseISO, getDaysInMonth } from "date-fns";

interface SpendingChartProps {
  dailySpending: { date: string; amount: number }[];
  month: number;
  year: number;
}

export function SpendingChart({
  dailySpending,
  month,
  year,
}: SpendingChartProps) {
  const { baseCurrency } = useCurrency();
  const { t, intlLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));

    return Array.from({ length: daysInMonth }, (_, i) => i + 1).reduce<
      { day: number; date: string; daily: number; cumulative: number; label: string }[]
    >((acc, day) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daySpend = dailySpending.find((d) => d.date === dateStr)?.amount ?? 0;
      const previousTotal = acc[acc.length - 1]?.cumulative ?? 0;

      acc.push({
        day,
        date: dateStr,
        daily: daySpend,
        cumulative: previousTotal - daySpend,
        label: new Intl.DateTimeFormat(intlLocale, {
          month: "short",
          day: "numeric",
        }).format(parseISO(dateStr)),
      });

      return acc;
    }, []);
  }, [dailySpending, intlLocale, month, year]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month - 1)),
    [intlLocale, month, year]
  );

  return (
    <Card className="border-border/80 bg-card/96">
      <CardHeader className="pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
              {t("Cash flow", "Flujo de caja")}
            </p>
            <CardTitle className="mt-2 font-heading text-[1.55rem] font-semibold tracking-tight">
              {t("Cumulative expense impact", "Impacto acumulado de gastos")}
            </CardTitle>
          </div>
          <div className="rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {monthLabel}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[280px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 5"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat(intlLocale, {
                      notation: "compact",
                      style: "currency",
                      currency: baseCurrency,
                      maximumFractionDigits: 0,
                    }).format(v)
                  }
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "18px",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    boxShadow: "0 28px 80px -44px rgba(0,0,0,0.9)",
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat(intlLocale, {
                      style: "currency",
                      currency: baseCurrency,
                    }).format(Number(value)),
                    t("Total", "Total"),
                  ]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--chart-1)"
                  strokeWidth={2.35}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-[1.5rem] bg-muted/50" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
