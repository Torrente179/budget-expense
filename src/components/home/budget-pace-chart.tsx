"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatCurrencyWithBreaks } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";

export interface BudgetPaceItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  ratio: number;
}

type PaceTone = "success" | "warning" | "danger";

const TONE_STROKE: Record<PaceTone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const TONE_TEXT: Record<PaceTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const TONE_SUBTLE: Record<PaceTone, string> = {
  success: "bg-success-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-danger-subtle",
};

function resolveTone(ratio: number, monthProgress: number): PaceTone {
  if (!Number.isFinite(ratio) || ratio >= 1) return "danger";
  if (ratio > monthProgress + 0.02) return "warning";
  return "success";
}

function formatUsagePercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "∞";
  const pct = Math.round(Math.min(ratio, 9.99) * 100);
  return pct > 999 ? "999+" : String(pct);
}

function CircularMeter({
  ratio,
  monthProgress,
  showPaceMark,
  size,
  strokeWidth,
  tone,
  children,
}: {
  ratio: number;
  monthProgress: number;
  showPaceMark: boolean;
  size: number;
  strokeWidth: number;
  tone: PaceTone;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Number.isFinite(ratio)
    ? Math.min(Math.max(ratio, 0), 1)
    : 1;
  const dashOffset = circumference * (1 - filled);
  const paceAngle = monthProgress * 360 - 90;
  const paceRad = (paceAngle * Math.PI) / 180;
  const paceX = size / 2 + radius * Math.cos(paceRad);
  const paceY = size / 2 + radius * Math.sin(paceRad);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showPaceMark && (
        <span
          aria-hidden
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: paceX, top: paceY }}
        />
      )}
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

function BudgetRow({
  budget,
  monthProgress,
  dense,
}: {
  budget: BudgetPaceItem;
  monthProgress: number;
  dense?: boolean;
}) {
  const { baseCurrency } = useCurrency();
  const itemTone = resolveTone(budget.ratio, monthProgress);
  const pct = formatUsagePercent(budget.ratio);
  const barWidth = Number.isFinite(budget.ratio)
    ? Math.min(Math.max(budget.ratio, 0), 1) * 100
    : 100;

  return (
    <Link
      href="/budget"
      className={cn(
        "block rounded-lg transition-colors hover:bg-accent/50 active:bg-accent/70",
        dense ? "px-2.5 py-2" : "px-1.5 py-1.5"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-body font-medium">
          {budget.name}
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-caption tabular-nums",
            TONE_TEXT[itemTone]
          )}
        >
          {pct}
          {pct !== "∞" ? "%" : ""}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${barWidth}%`,
            backgroundColor: TONE_STROKE[itemTone],
          }}
        />
      </div>
      <p className="mt-1 font-mono text-[0.625rem] leading-tight tabular-nums text-muted-foreground">
        <span className="text-negative">
          {formatCurrencyWithBreaks(budget.spent, baseCurrency)}
        </span>
        {" / "}
        {formatCurrencyWithBreaks(budget.limit, baseCurrency)}
      </p>
    </Link>
  );
}

interface BudgetPaceChartProps {
  budgets: BudgetPaceItem[];
  totalBudgeted: number;
  totalSpent: number;
  consumedRatio: number;
  monthProgress: number;
  dayOfMonth: number;
  daysInMonth: number;
  isCurrentMonth: boolean;
}

/**
 * Home budgets overview.
 * Mobile: compact ring + stacked list (charts earn their keep in a narrow column).
 * Desktop: dense header strip + multi-column budget grid — no oversized rings.
 * Both layouts are always in the DOM; CSS toggles visibility (no media-query flash).
 */
export function BudgetPaceChart({
  budgets,
  totalBudgeted,
  totalSpent,
  consumedRatio,
  monthProgress,
  dayOfMonth,
  daysInMonth,
  isCurrentMonth,
}: BudgetPaceChartProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  const remaining = totalBudgeted - totalSpent;
  const usedLabel = formatUsagePercent(consumedRatio);
  const tone = resolveTone(consumedRatio, monthProgress);
  const overBudget = !Number.isFinite(consumedRatio) || consumedRatio >= 1;
  const filled = Number.isFinite(consumedRatio)
    ? Math.min(Math.max(consumedRatio, 0), 1)
    : 1;

  const statusLabel = overBudget
    ? t("Over budget", "Sobre presupuesto")
    : consumedRatio > monthProgress + 0.02
      ? t("Ahead of pace", "Por delante del ritmo")
      : consumedRatio < monthProgress - 0.08
        ? t("Under pace", "Por debajo del ritmo")
        : t("On pace", "Al ritmo");

  const aria = t(
    `Budget ${usedLabel}% used, ${statusLabel}`,
    `Presupuesto ${usedLabel}% usado, ${statusLabel}`
  );

  return (
    <div role="group" aria-label={aria}>
      {/* Desktop — dense strip + grid */}
      <div className="hidden space-y-3 md:block">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 space-y-0.5">
            <p className="label-caps">{statusLabel}</p>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={cn(
                  "font-mono text-title font-semibold tabular-nums",
                  remaining >= 0 ? "text-foreground" : "text-negative"
                )}
              >
                {formatCurrency(remaining, baseCurrency)}
              </span>
              <span className="text-caption text-muted-foreground">
                {t(
                  `left of ${formatCurrency(totalBudgeted, baseCurrency)}`,
                  `restante de ${formatCurrency(totalBudgeted, baseCurrency)}`
                )}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[0.625rem] font-medium tabular-nums",
                  TONE_SUBTLE[tone],
                  TONE_TEXT[tone]
                )}
              >
                {usedLabel}
                {usedLabel !== "∞" ? "%" : ""} {t("used", "usado")}
              </span>
            </p>
          </div>
          {isCurrentMonth && (
            <p className="text-caption text-muted-foreground">
              {t(
                `Day ${dayOfMonth} of ${daysInMonth}`,
                `Día ${dayOfMonth} de ${daysInMonth}`
              )}
            </p>
          )}
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${filled * 100}%`,
              backgroundColor: TONE_STROKE[tone],
            }}
          />
          {isCurrentMonth && (
            <div
              aria-hidden
              className="absolute inset-y-0 w-0.5 rounded-full bg-foreground/55"
              style={{ left: `${monthProgress * 100}%` }}
            />
          )}
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="rounded-xl border border-border/60 bg-secondary/25"
            >
              <BudgetRow
                budget={budget}
                monthProgress={monthProgress}
                dense
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — ring + list */}
      <div className="flex items-start gap-3 md:hidden">
        <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1">
          <CircularMeter
            ratio={consumedRatio}
            monthProgress={monthProgress}
            showPaceMark={isCurrentMonth}
            size={72}
            strokeWidth={7}
            tone={tone}
          >
            <span
              className={cn(
                "font-mono text-sm font-semibold leading-none tracking-[-0.03em] tabular-nums",
                TONE_TEXT[tone]
              )}
            >
              {usedLabel}
              {usedLabel !== "∞" && (
                <span className="text-[0.5rem]">%</span>
              )}
            </span>
          </CircularMeter>
          <p
            className={cn(
              "text-center text-[0.5625rem] font-medium leading-tight",
              TONE_TEXT[tone]
            )}
          >
            {statusLabel}
          </p>
          <p
            className={cn(
              "text-center font-mono text-[0.625rem] tabular-nums",
              remaining >= 0 ? "text-foreground" : "text-negative"
            )}
          >
            {formatCurrency(remaining, baseCurrency)}
          </p>
        </div>

        <div className="min-w-0 flex-1 divide-y divide-border/50">
          {budgets.map((budget) => (
            <BudgetRow
              key={budget.id}
              budget={budget}
              monthProgress={monthProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
