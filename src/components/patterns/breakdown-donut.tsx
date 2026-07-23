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
  /** Number of leading slices to label around the ring with name and share. */
  calloutCount?: number;
  /** Keeps the compact list below/beside the chart when enabled. */
  showLegend?: boolean;
  size?: number;
  className?: string;
}

const CALLOUT_CHART = {
  width: 340,
  height: 260,
  centerX: 170,
  centerY: 130,
  radius: 68,
  strokeWidth: 18,
} as const;

interface SliceCallout {
  slice: DonutSlice;
  side: "left" | "right";
  startX: number;
  startY: number;
  bendX: number;
  bendY: number;
  labelY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = pointOnCircle(centerX, centerY, radius, startAngle);
  const end = pointOnCircle(centerX, centerY, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
  ].join(" ");
}

function wrapCalloutLabel(label: string) {
  const maxCharacters = 15;
  const normalized = label.trim();
  if (normalized.length <= maxCharacters) return [normalized];

  const firstBreak = normalized.lastIndexOf(" ", maxCharacters);
  const splitAt =
    firstBreak >= 6
      ? firstBreak
      : normalized.indexOf(" ", maxCharacters) >= 0
        ? normalized.indexOf(" ", maxCharacters)
        : maxCharacters;
  const firstLine = normalized.slice(0, splitAt).trim();
  const remainder = normalized.slice(splitAt).trim();
  const secondLine =
    remainder.length > maxCharacters
      ? `${remainder.slice(0, maxCharacters - 1).trim()}…`
      : remainder;

  return [firstLine, secondLine].filter(Boolean);
}

function distributeCallouts(callouts: SliceCallout[]) {
  const minimumY = 28;
  const maximumY = CALLOUT_CHART.height - 30;
  const minimumGap = 44;
  const positioned = [...callouts].sort((a, b) => a.labelY - b.labelY);

  for (let index = 1; index < positioned.length; index += 1) {
    positioned[index].labelY = Math.max(
      positioned[index].labelY,
      positioned[index - 1].labelY + minimumGap
    );
  }

  if (
    positioned.length > 0 &&
    positioned[positioned.length - 1].labelY > maximumY
  ) {
    const overflow =
      positioned[positioned.length - 1].labelY - maximumY;
    positioned.forEach((callout) => {
      callout.labelY -= overflow;
    });
  }

  for (let index = positioned.length - 2; index >= 0; index -= 1) {
    positioned[index].labelY = Math.min(
      positioned[index].labelY,
      positioned[index + 1].labelY - minimumGap
    );
  }

  if (positioned.length > 0 && positioned[0].labelY < minimumY) {
    const underflow = minimumY - positioned[0].labelY;
    positioned.forEach((callout) => {
      callout.labelY += underflow;
    });
  }

  return positioned;
}

function buildSliceCallouts(
  slices: DonutSlice[],
  total: number,
  calloutCount: number
) {
  if (total <= 0 || calloutCount <= 0) return [] as SliceCallout[];

  let preceding = 0;
  const callouts = slices.flatMap((slice, index) => {
    const midpoint =
      -Math.PI / 2 +
      ((preceding + slice.value / 2) / total) * Math.PI * 2;
    preceding += slice.value;
    if (index >= calloutCount) return [];

    const cosine = Math.cos(midpoint);
    const sine = Math.sin(midpoint);
    const side = cosine >= 0 ? "right" : "left";
    const ringEdge =
      CALLOUT_CHART.radius + CALLOUT_CHART.strokeWidth / 2 + 2;
    const bendRadius = ringEdge + 13;

    return [
      {
        slice,
        side,
        startX: CALLOUT_CHART.centerX + cosine * ringEdge,
        startY: CALLOUT_CHART.centerY + sine * ringEdge,
        bendX: CALLOUT_CHART.centerX + cosine * bendRadius,
        bendY: CALLOUT_CHART.centerY + sine * bendRadius,
        labelY: clamp(
          CALLOUT_CHART.centerY + sine * (bendRadius + 18),
          28,
          CALLOUT_CHART.height - 30
        ),
      } satisfies SliceCallout,
    ];
  });

  const left = distributeCallouts(
    callouts.filter((callout) => callout.side === "left")
  );
  const right = distributeCallouts(
    callouts.filter((callout) => callout.side === "right")
  );

  return [...left, ...right];
}

/**
 * The app's one donut: a thin ring with a center total plus optional callouts
 * and a compact legend. Colors come from the caller (category hex or chart
 * tokens). Used by Home and Wealth for a single visual language.
 */
export function BreakdownDonut({
  slices,
  centerLabel,
  centerValue,
  amountTone = "default",
  onSelect,
  nonInteractiveIds = [],
  calloutCount = 0,
  showLegend = true,
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
  const hasCallouts = calloutCount > 0;
  const callouts = buildSliceCallouts(slices, total, calloutCount);

  const canSelect = (id: string) =>
    Boolean(onSelect) && !nonInteractiveIds.includes(id);

  function handleSliceKeyDown(
    event: KeyboardEvent<SVGPathElement>,
    sliceId: string
  ) {
    if (!canSelect(sliceId)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect?.(sliceId);
  }

  function renderSlicePath(
    slice: DonutSlice,
    index: number,
    geometry: {
      centerX: number;
      centerY: number;
      radius: number;
      strokeWidth: number;
    }
  ) {
    const preceding = slices
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    const sweepAngle = (slice.value / total) * 360;
    const gapAngle = Math.min(1.5, sweepAngle * 0.2);
    const startAngle =
      -90 + (preceding / total) * 360 + gapAngle / 2;
    const endAngle = startAngle + sweepAngle - gapAngle;
    const interactive = canSelect(slice.id);
    const active = activeSliceId === slice.id;
    const dimmed = activeSliceId !== null && activeSliceId !== slice.id;

    return (
      <path
        key={slice.id}
        d={describeArc(
          geometry.centerX,
          geometry.centerY,
          geometry.radius,
          startAngle,
          endAngle
        )}
        fill="none"
        stroke={slice.color}
        strokeWidth={active ? geometry.strokeWidth + 2 : geometry.strokeWidth}
        strokeLinecap="round"
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
        onClick={interactive ? () => onSelect?.(slice.id) : undefined}
        onKeyDown={(event) => handleSliceKeyDown(event, slice.id)}
      />
    );
  }

  return (
    <div
      className={cn(
        hasCallouts
          ? "flex flex-col items-center gap-4"
          : "flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row",
        className
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          hasCallouts && "aspect-[17/13] w-full max-w-[23rem]"
        )}
        style={
          hasCallouts
            ? undefined
            : {
                height: size,
                width: size,
              }
        }
      >
        {total > 0 && hasCallouts && (
          <svg
            viewBox={`0 0 ${CALLOUT_CHART.width} ${CALLOUT_CHART.height}`}
            className="h-full w-full overflow-visible"
            role={onSelect ? "group" : undefined}
            aria-label={
              onSelect && typeof centerLabel === "string"
                ? centerLabel
                : undefined
            }
            aria-hidden={onSelect ? undefined : true}
          >
            {slices.map((slice, index) =>
              renderSlicePath(slice, index, {
                centerX: CALLOUT_CHART.centerX,
                centerY: CALLOUT_CHART.centerY,
                radius: CALLOUT_CHART.radius,
                strokeWidth: CALLOUT_CHART.strokeWidth,
              })
            )}
            <g aria-hidden className="pointer-events-none">
              {callouts.map((callout) => {
                const lineEndX = callout.side === "right" ? 252 : 88;
                const textX = callout.side === "right" ? 258 : 82;
                const textAnchor =
                  callout.side === "right" ? "start" : "end";
                const labelLines = wrapCalloutLabel(callout.slice.name);
                const active = activeSliceId === callout.slice.id;
                const dimmed =
                  activeSliceId !== null &&
                  activeSliceId !== callout.slice.id;
                const nameStartY =
                  callout.labelY - (labelLines.length > 1 ? 10 : 3);

                return (
                  <g
                    key={callout.slice.id}
                    opacity={dimmed ? 0.35 : 1}
                    className="transition-opacity duration-150"
                  >
                    <path
                      d={[
                        `M ${callout.startX} ${callout.startY}`,
                        `L ${callout.bendX} ${callout.bendY}`,
                        `L ${lineEndX} ${callout.labelY}`,
                      ].join(" ")}
                      fill="none"
                      stroke={callout.slice.color}
                      strokeWidth={active ? 2 : 1.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text
                      x={textX}
                      y={nameStartY}
                      textAnchor={textAnchor}
                      fill="var(--foreground)"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {labelLines.map((line, lineIndex) => (
                        <tspan
                          key={`${callout.slice.id}-${line}`}
                          x={textX}
                          dy={lineIndex === 0 ? 0 : 11}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                    <text
                      x={textX}
                      y={callout.labelY + 14}
                      textAnchor={textAnchor}
                      fill={callout.slice.color}
                      fontSize="12"
                      fontWeight="700"
                    >
                      {Math.round((callout.slice.value / total) * 100)}%
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        {total > 0 && !hasCallouts && (
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            aria-hidden={onSelect ? undefined : true}
            role={onSelect ? "group" : undefined}
            aria-label={
              onSelect && typeof centerLabel === "string"
                ? centerLabel
                : undefined
            }
          >
            {slices.map((slice, index) =>
              renderSlicePath(slice, index, {
                centerX: 50,
                centerY: 50,
                radius: 42,
                strokeWidth: 11,
              })
            )}
          </svg>
        )}
        <div
          className={cn(
            "pointer-events-none absolute flex flex-col items-center justify-center gap-0.5 text-center",
            hasCallouts
              ? "left-1/2 top-1/2 w-[30%] -translate-x-1/2 -translate-y-1/2"
              : "inset-0"
          )}
        >
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

      {showLegend && (
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
      )}
    </div>
  );
}
