"use client";

import type { CSSProperties, ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/providers/currency-provider";
import {
  formatCurrencyParts,
  formatCurrencyWithBreaks,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useChartMounted } from "@/components/charts/chart-theme";

export interface DonutSlice {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface BreakdownDonutProps {
  slices: DonutSlice[];
  /** Center caption above the total (e.g. "Spent", "Net worth"). */
  centerLabel: ReactNode;
  /** When set, shows this instead of the summed total in the center. */
  centerValue?: number;
  /** Semantic color for center total and legend amounts. */
  amountTone?: "default" | "negative";
  /** Called when a slice/row is clicked (skips slices whose onSelect isn't wanted). */
  onSelect?: (id: string) => void;
  /** Ids that should not be clickable (e.g. an aggregated "Other"). */
  nonInteractiveIds?: string[];
  /** Ring diameter in px below `md`. */
  size?: number;
  /** Ring diameter from `md` up — keeps desktop dense. */
  desktopSize?: number;
  className?: string;
}

/**
 * The app's one donut: a thin ring with a center total and a live legend.
 * Mobile gets a slightly larger ring; desktop stays compact so the legend leads.
 */
export function BreakdownDonut({
  slices,
  centerLabel,
  centerValue,
  amountTone = "default",
  onSelect,
  nonInteractiveIds = [],
  size = 128,
  desktopSize = 96,
  className,
}: BreakdownDonutProps) {
  const amountClass =
    amountTone === "negative" ? "text-negative" : "text-foreground";
  const { baseCurrency } = useCurrency();
  const mounted = useChartMounted();
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const displayTotal = centerValue ?? total;
  const centerTotal = formatCurrencyParts(displayTotal, baseCurrency);

  const canSelect = (id: string) =>
    Boolean(onSelect) && !nonInteractiveIds.includes(id);

  const frameStyle = {
    "--donut-size": `${size}px`,
    "--donut-size-md": `${desktopSize}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4",
        className
      )}
    >
      <div
        className="relative mx-auto h-[var(--donut-size)] w-[var(--donut-size)] shrink-0 md:h-[var(--donut-size-md)] md:w-[var(--donut-size-md)] sm:mx-0"
        style={frameStyle}
      >
        {mounted && total > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="72%"
                outerRadius="94%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
                onClick={(_, index) => {
                  const slice = slices[index];
                  if (slice && canSelect(slice.id)) onSelect?.(slice.id);
                }}
              >
                {slices.map((slice) => (
                  <Cell
                    key={slice.id}
                    fill={slice.color}
                    cursor={canSelect(slice.id) ? "pointer" : "default"}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          <span className="label-caps text-[0.5625rem]">{centerLabel}</span>
          <span
            className={cn(
              "max-w-[78%] font-mono text-[0.625rem] font-semibold leading-none tracking-[-0.025em] tabular-nums md:text-[0.5625rem]",
              amountClass
            )}
          >
            {centerTotal.value}
          </span>
          <span className="font-mono text-[0.5rem] leading-none tabular-nums text-muted-foreground">
            {centerTotal.currency}
          </span>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-0 overflow-y-auto sm:max-h-[14rem]">
        {slices.map((slice) => {
          const interactive = canSelect(slice.id);
          const row = (
            <>
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-caption sm:text-body">
                {slice.name}
              </span>
              <span className="shrink-0 font-mono text-[0.625rem] tabular-nums text-muted-foreground">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
              <span
                className={cn(
                  "max-w-24 shrink text-right font-mono text-[0.625rem] leading-tight tabular-nums",
                  amountClass
                )}
              >
                {formatCurrencyWithBreaks(slice.value, baseCurrency)}
              </span>
            </>
          );
          return interactive ? (
            <button
              key={slice.id}
              type="button"
              onClick={() => onSelect?.(slice.id)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent/50"
            >
              {row}
            </button>
          ) : (
            <div
              key={slice.id}
              className="flex w-full items-center gap-2 px-1.5 py-1 text-left"
            >
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}
