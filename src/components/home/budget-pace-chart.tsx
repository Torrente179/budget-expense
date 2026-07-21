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
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-1 ring-2 ring-card"
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
 * Compact home budget overview: small % ring + per-budget bars.
 * Always ring-beside-list so it stays short on mobile.
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

  const statusLabel = overBudget
    ? t("Over budget", "Sobre presupuesto")
    : consumedRatio > monthProgress + 0.02
      ? t("Ahead of pace", "Por delante del ritmo")
      : consumedRatio < monthProgress - 0.08
        ? t("Under pace", "Por debajo del ritmo")
        : t("On pace", "Al ritmo");

  return (
    <div
      className="flex items-start gap-3 sm:gap-4"
      role="group"
      aria-label={t(
        `Budget ${usedLabel}% used, ${statusLabel}`,
        `Presupuesto ${usedLabel}% usado, ${statusLabel}`
      )}
    >
      <div className="flex w-[5.75rem] shrink-0 flex-col items-center gap-1.5 sm:w-[6.5rem]">
        <CircularMeter
          ratio={consumedRatio}
          monthProgress={monthProgress}
          showPaceMark={isCurrentMonth}
          size={88}
          strokeWidth={8}
          tone={tone}
        >
          <span
            className={cn(
              "font-mono text-base font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-lg",
              TONE_TEXT[tone]
            )}
          >
            {usedLabel}
            {usedLabel !== "∞" && (
              <span className="text-[0.625rem]">%</span>
            )}
          </span>
        </CircularMeter>
        <p
          className={cn(
            "rounded-full px-2 py-0.5 text-center text-[0.625rem] font-medium leading-tight",
            TONE_SUBTLE[tone],
            TONE_TEXT[tone]
          )}
        >
          {statusLabel}
        </p>
        <p
          className={cn(
            "text-center font-mono text-caption tabular-nums",
            remaining >= 0 ? "text-foreground" : "text-negative"
          )}
        >
          {formatCurrency(remaining, baseCurrency)}
        </p>
        <p className="text-center text-[0.625rem] leading-tight text-muted-foreground">
          {t(
            `of ${formatCurrency(totalBudgeted, baseCurrency)}`,
            `de ${formatCurrency(totalBudgeted, baseCurrency)}`
          )}
        </p>
        {isCurrentMonth && (
          <p className="text-center text-[0.5625rem] leading-tight text-muted-foreground">
            {t(
              `Day ${dayOfMonth}/${daysInMonth}`,
              `Día ${dayOfMonth}/${daysInMonth}`
            )}
          </p>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        {budgets.map((budget) => {
          const itemTone = resolveTone(budget.ratio, monthProgress);
          const pct = formatUsagePercent(budget.ratio);
          const barWidth = Number.isFinite(budget.ratio)
            ? Math.min(Math.max(budget.ratio, 0), 1) * 100
            : 100;
          return (
            <Link
              key={budget.id}
              href="/budget"
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-accent/50 active:bg-accent/70"
            >
              <div className="min-w-0 flex-1 space-y-1">
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
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: TONE_STROKE[itemTone],
                    }}
                  />
                </div>
                <p className="font-mono text-[0.6875rem] leading-tight tabular-nums text-muted-foreground">
                  <span className="text-negative">
                    {formatCurrencyWithBreaks(budget.spent, baseCurrency)}
                  </span>
                  {" / "}
                  {formatCurrencyWithBreaks(budget.limit, baseCurrency)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
