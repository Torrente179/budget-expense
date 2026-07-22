"use client";

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
import { ChartCard } from "@/components/charts/chart-card";
import {
  ChartAreaGradient,
  chartAxisProps,
  chartGridProps,
  chartTooltipStyle,
  compactCurrencyTick,
  currencyTooltipFormatter,
} from "@/components/charts/chart-theme";
import { useLocale } from "@/providers/locale-provider";

export interface InsightsTrendChartsProps {
  trendData: Array<{ month: string; label: string; total: number }>;
  cumulativeData: Array<{ label: string; total: number }>;
  intlLocale: string;
  baseCurrency: string;
}

export function InsightsTrendCharts({
  trendData,
  cumulativeData,
  intlLocale,
  baseCurrency,
}: InsightsTrendChartsProps) {
  const { t } = useLocale();
  const tooltipFormatter = currencyTooltipFormatter(intlLocale, baseCurrency);

  return (
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
              isAnimationActive={false}
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
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
