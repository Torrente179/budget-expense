"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useChartMounted } from "@/components/charts/chart-theme";
import type { ReactNode } from "react";

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
  /** Called when a slice/row is clicked (skips slices whose onSelect isn't wanted). */
  onSelect?: (id: string) => void;
  /** Ids that should not be clickable (e.g. an aggregated "Other"). */
  nonInteractiveIds?: string[];
  size?: number;
  className?: string;
}

/**
 * The app's one donut: a thin ring with a center total and a live legend
 * showing share % and amount. Colors come from the caller (category hex or
 * chart tokens). Used by Home and Wealth for a single visual language.
 */
export function BreakdownDonut({
  slices,
  centerLabel,
  centerValue,
  onSelect,
  nonInteractiveIds = [],
  size = 160,
  className,
}: BreakdownDonutProps) {
  const { baseCurrency } = useCurrency();
  const mounted = useChartMounted();
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const displayTotal = centerValue ?? total;

  const canSelect = (id: string) =>
    Boolean(onSelect) && !nonInteractiveIds.includes(id);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row",
        className
      )}
    >
      <div
        className="relative shrink-0"
        style={{ height: size, width: size }}
      >
        {mounted && total > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={size * 0.33}
                outerRadius={size * 0.47}
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="label-caps">{centerLabel}</span>
          <span className="font-mono text-caption font-semibold tabular-nums">
            {formatCurrency(displayTotal, baseCurrency)}
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-0.5">
        {slices.map((slice) => {
          const interactive = canSelect(slice.id);
          const row = (
            <>
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-body">
                {slice.name}
              </span>
              <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
              <span className="w-20 shrink-0 text-right font-mono text-caption tabular-nums">
                {formatCurrency(slice.value, baseCurrency)}
              </span>
            </>
          );
          return interactive ? (
            <button
              key={slice.id}
              type="button"
              onClick={() => onSelect?.(slice.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
            >
              {row}
            </button>
          ) : (
            <div
              key={slice.id}
              className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left"
            >
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}
