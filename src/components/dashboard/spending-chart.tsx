"use client";

import { useMemo } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, getDaysInMonth } from "date-fns";

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

  const data = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    let cumulative = 0;

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daySpend =
        dailySpending.find((d) => d.date === dateStr)?.amount ?? 0;
      cumulative += daySpend;

      return {
        day,
        date: dateStr,
        daily: daySpend,
        cumulative,
        label: format(parseISO(dateStr), "MMM d"),
      };
    });
  }, [dailySpending, month, year]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Cumulative spending
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
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
                  new Intl.NumberFormat("en", {
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
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                }}
                formatter={(value) => [
                  new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: baseCurrency,
                  }).format(Number(value)),
                  "Total",
                ]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#spendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
