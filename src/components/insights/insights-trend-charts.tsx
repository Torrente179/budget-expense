"use client";

import {
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
  SPEND_CHART_COLOR,
  chartAxisProps,
  chartGridProps,
  chartTooltipStyle,
  compactCurrencyTick,
  currencyTooltipFormatter,
} from "@/components/charts/chart-theme";
import { useLocale } from "@/providers/locale-provider";

export interface InsightsTrendChartsProps {
  trendData: Array<{ month: string; label: string; total: number }>;
  dailySpendData: Array<{ label: string; total: number }>;
  intlLocale: string;
  baseCurrency: string;
}

export function InsightsTrendCharts({
  trendData,
  dailySpendData,
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
              fill={SPEND_CHART_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        eyebrow={t("This month", "Este mes")}
        title={t("Daily spending", "Gasto diario")}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={dailySpendData}>
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
              cursor={{ fill: "var(--chart-grid)" }}
              formatter={(value) => [
                tooltipFormatter(Number(value)),
                t("Spent", "Gastado"),
              ]}
            />
            <Bar
              dataKey="total"
              fill={SPEND_CHART_COLOR}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
