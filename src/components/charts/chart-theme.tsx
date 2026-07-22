"use client";

import { useSyncExternalStore } from "react";

/**
 * Centralized Recharts theming so every chart shares one visual language.
 * Grid and axes stay recessive (chart tokens), tooltips use the popover
 * surface, and gradients derive from the series color.
 */

/** Shared Tooltip contentStyle — spread into <Tooltip contentStyle={…}>. */
export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
  boxShadow: "var(--elevation-2)",
  color: "var(--popover-foreground)",
};

/** Shared axis props — spread into <XAxis {...chartAxisProps}> / <YAxis>. */
export const chartAxisProps = {
  tick: { fontSize: 10, fill: "var(--chart-axis)" },
  tickLine: false,
  axisLine: false,
} as const;

/** Shared grid props — spread into <CartesianGrid {...chartGridProps}>. */
export const chartGridProps = {
  strokeDasharray: "2 5",
  stroke: "var(--chart-grid)",
  vertical: false,
} as const;

/** Vertical fade gradient def for area fills. Use fill={`url(#${id})`}. */
export function ChartAreaGradient({
  id,
  color = "var(--chart-1)",
}: {
  id: string;
  color?: string;
}) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.32} />
        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );
}

/**
 * Recharts measures its container in the browser; render charts only
 * after mount to avoid SSR/hydration size glitches.
 */
export function useChartMounted() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}

/** Compact currency formatter for axis ticks. */
export function compactCurrencyTick(intlLocale: string, currency: string) {
  const formatter = new Intl.NumberFormat(intlLocale, {
    notation: "compact",
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return (value: number) => formatter.format(value);
}

/** Full currency formatter for tooltip values. */
export function currencyTooltipFormatter(
  intlLocale: string,
  currency: string
) {
  const formatter = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
  });
  return (value: number | string) => formatter.format(Number(value));
}
