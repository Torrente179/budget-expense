"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import { UnderlineTabs } from "@/components/patterns/underline-tabs";
import { PALETTE } from "@/lib/palette";
import {
  resolveTrendSeries,
  type NetWorthSnapshotPoint,
  type TrendRange,
} from "@/lib/wealth/net-worth";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

const RANGES: TrendRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

interface NetWorthTrendCardProps {
  snapshots: NetWorthSnapshotPoint[];
  /** Today, injected so the component stays deterministic in previews. */
  today?: string;
  variant?: "card" | "section";
}

/**
 * Evolución — net worth over time.
 *
 * History is not backfilled, so a brand-new user has one point or none. That
 * first-run case gets its own copy rather than an empty plot: an axis with
 * nothing on it looks broken, and this is expected.
 */
export function NetWorthTrendCard({
  snapshots,
  today,
  variant = "card",
}: NetWorthTrendCardProps) {
  const { t, locale } = useLocale();
  const { baseCurrency } = useCurrency();
  const [range, setRange] = useState<TrendRange>("6M");

  const asOf = today ?? new Date().toISOString().slice(0, 10);
  const intlLocale = locale === "es" ? "es-ES" : "en-US";
  const tooltipFormatter = currencyTooltipFormatter(intlLocale, baseCurrency);

  const series = useMemo(
    () => resolveTrendSeries({ snapshots, range, today: asOf }),
    [snapshots, range, asOf]
  );

  const data = useMemo(
    () =>
      series.map((point) => ({
        date: point.asOfDate,
        netWorth: point.netWorth,
        label: new Date(`${point.asOfDate}T00:00:00Z`).toLocaleDateString(
          intlLocale,
          { day: "numeric", month: "short", timeZone: "UTC" }
        ),
      })),
    [series, intlLocale]
  );

  const rangeSwitch = (
    <UnderlineTabs
      tabs={RANGES.map((key) => ({
        key,
        label: key === "ALL" ? t("All", "Todo") : key,
      }))}
      value={range}
      onChange={setRange}
      ariaLabel={t("Time range", "Rango de tiempo")}
      className="-mx-0 gap-4 border-b-0 px-0"
    />
  );

  // One point cannot draw a line — say so instead of rendering an empty axis.
  if (data.length < 2) {
    return (
      <ChartCard
        eyebrow={t("History", "Historial")}
        title={t("Evolution", "Evolución")}
        height={200}
        variant={variant}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-body font-medium">
            {t("Building your history", "Construyendo tu historial")}
          </p>
          <p className="max-w-xs text-caption text-muted-foreground">
            {t(
              "We record your net worth each day you open the app. Your first trend line appears once there are a couple of days to compare.",
              "Registramos tu patrimonio cada día que abres la app. Tu primera línea aparecerá cuando haya un par de días que comparar."
            )}
          </p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      eyebrow={t("History", "Historial")}
      title={t("Evolution", "Evolución")}
      action={rangeSwitch}
      height={200}
      variant={variant}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <ChartAreaGradient
            id="net-worth-trend"
            color={PALETTE.wealth.investments}
          />
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="label" {...chartAxisProps} minTickGap={24} />
          <YAxis
            {...chartAxisProps}
            width={52}
            tickFormatter={compactCurrencyTick(intlLocale, baseCurrency)}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            cursor={{ stroke: "var(--chart-grid)" }}
            formatter={(value) => [
              tooltipFormatter(Number(value)),
              t("Net worth", "Patrimonio neto"),
            ]}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            name={t("Net worth", "Patrimonio neto")}
            stroke={PALETTE.wealth.investments}
            strokeWidth={2}
            fill="url(#net-worth-trend)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
