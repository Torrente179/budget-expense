"use client";

import { useCurrency } from "@/providers/currency-provider";
import {
  formatCurrencyParts,
  formatCurrencyWithBreaks,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState, type KeyboardEvent, type ReactNode } from "react";

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
  amountTone = "default",
  onSelect,
  nonInteractiveIds = [],
  size = 160,
  className,
}: BreakdownDonutProps) {
  const amountClass =
    amountTone === "negative" ? "text-negative" : "text-foreground";
  const { baseCurrency } = useCurrency();
  const [activeSliceId, setActiveSliceId] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const displayTotal = centerValue ?? total;
  const activeSlice =
    slices.find((slice) => slice.id === activeSliceId) ?? null;
  const centerTotal = formatCurrencyParts(
    activeSlice?.value ?? displayTotal,
    baseCurrency
  );

  const canSelect = (id: string) =>
    Boolean(onSelect) && !nonInteractiveIds.includes(id);

  function handleSliceKeyDown(
    event: KeyboardEvent<SVGCircleElement>,
    sliceId: string
  ) {
    if (!canSelect(sliceId)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect?.(sliceId);
  }

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
        {total > 0 && (
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="-rotate-90"
            aria-hidden={onSelect ? undefined : true}
            role={onSelect ? "group" : undefined}
            aria-label={
              onSelect && typeof centerLabel === "string"
                ? centerLabel
                : undefined
            }
          >
            {slices.map((slice, index) => {
              const circumference = 2 * Math.PI * 42;
              const preceding = slices
                .slice(0, index)
                .reduce((sum, item) => sum + item.value, 0);
              const length = Math.max(
                (slice.value / total) * circumference - 1.5,
                0
              );
              const interactive = canSelect(slice.id);
              const active = activeSliceId === slice.id;
              const dimmed =
                activeSliceId !== null && activeSliceId !== slice.id;
              return (
                <circle
                  key={slice.id}
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={active ? "13" : "11"}
                  strokeLinecap="round"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-(preceding / total) * circumference}
                  opacity={dimmed ? 0.45 : 1}
                  role={interactive ? "button" : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={interactive ? slice.name : undefined}
                  className={cn(
                    "origin-center transition-[opacity,stroke-width] duration-150 outline-none",
                    interactive && "cursor-pointer"
                  )}
                  onPointerEnter={() => setActiveSliceId(slice.id)}
                  onPointerLeave={() =>
                    setActiveSliceId((current) =>
                      current === slice.id ? null : current
                    )
                  }
                  onFocus={() => setActiveSliceId(slice.id)}
                  onBlur={() =>
                    setActiveSliceId((current) =>
                      current === slice.id ? null : current
                    )
                  }
                  onClick={
                    interactive ? () => onSelect?.(slice.id) : undefined
                  }
                  onKeyDown={(event) =>
                    handleSliceKeyDown(event, slice.id)
                  }
                />
              );
            })}
          </svg>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          <span
            className={cn(
              activeSlice
                ? "max-w-[72%] text-balance text-[0.5625rem] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground"
                : "label-caps"
            )}
          >
            {activeSlice?.name ?? centerLabel}
          </span>
          <span
            className={cn(
              "max-w-[72%] font-mono text-[0.6875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums",
              amountClass
            )}
          >
            {centerTotal.value}
          </span>
          <span className="font-mono text-[0.5625rem] leading-none tabular-nums text-muted-foreground">
            {centerTotal.currency}
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
              <span
                className={cn(
                  "max-w-28 shrink text-right font-mono text-[0.6875rem] leading-tight tabular-nums",
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
