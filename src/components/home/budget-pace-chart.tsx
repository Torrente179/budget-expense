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
  if (ratio >= 1) return "danger";
  if (ratio > monthProgress + 0.02) return "warning";
  return "success";
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
  const filled = Math.min(Math.max(ratio, 0), 1);
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
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-1 ring-2 ring-card"
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
 * Home monthly-budget overview: a large % ring (pace vs calendar) plus
 * per-objective rows with compact meters. Stacks on mobile; ring + list
 * side-by-side from sm up.
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
  const usedPercent = Math.round(Math.min(consumedRatio, 9.99) * 100);
  const tone = resolveTone(consumedRatio, monthProgress);
  const paceTone = resolveTone(consumedRatio, monthProgress);

  const statusLabel =
    consumedRatio >= 1
      ? t("Over budget", "Sobre presupuesto")
      : consumedRatio > monthProgress + 0.02
        ? t("Ahead of pace", "Por delante del ritmo")
        : consumedRatio < monthProgress - 0.08
          ? t("Under pace", "Por debajo del ritmo")
          : t("On pace", "Al ritmo");

  return (
    <div
      className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6 lg:flex-col xl:flex-row xl:items-center"
      role="group"
      aria-label={t(
        `Budget ${usedPercent}% used, ${statusLabel}`,
        `Presupuesto ${usedPercent}% usado, ${statusLabel}`
      )}
    >
      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:shrink-0">
        <CircularMeter
          ratio={consumedRatio}
          monthProgress={monthProgress}
          showPaceMark={isCurrentMonth}
          size={152}
          strokeWidth={11}
          tone={tone}
        >
          <span
            className={cn(
              "font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums",
              TONE_TEXT[tone]
            )}
          >
            {usedPercent > 999 ? "999+" : usedPercent}
            <span className="text-[0.95rem]">%</span>
          </span>
          <span className="label-caps mt-1">
            {t("used", "usado")}
          </span>
        </CircularMeter>

        <div className="w-full max-w-[16rem] space-y-1.5 text-center sm:max-w-[11.5rem]">
          <p
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-caption font-medium",
              TONE_SUBTLE[paceTone],
              TONE_TEXT[paceTone]
            )}
          >
            {statusLabel}
          </p>
          <p
            className={cn(
              "font-mono text-heading tabular-nums",
              remaining >= 0 ? "text-foreground" : "text-negative"
            )}
          >
            {formatCurrency(remaining, baseCurrency)}
          </p>
          <p className="text-caption text-muted-foreground">
            {t(
              `left of ${formatCurrency(totalBudgeted, baseCurrency)}`,
              `restante de ${formatCurrency(totalBudgeted, baseCurrency)}`
            )}
          </p>
          {isCurrentMonth && (
            <p className="text-caption text-muted-foreground">
              {t(
                `Day ${dayOfMonth} of ${daysInMonth} · mark = today`,
                `Día ${dayOfMonth} de ${daysInMonth} · marca = hoy`
              )}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {budgets.map((budget) => {
          const itemTone = resolveTone(budget.ratio, monthProgress);
          const pct = Math.round(Math.min(budget.ratio, 9.99) * 100);
          return (
            <Link
              key={budget.id}
              href="/budget"
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/50 active:bg-accent/70"
            >
              <CircularMeter
                ratio={budget.ratio}
                monthProgress={monthProgress}
                showPaceMark={false}
                size={40}
                strokeWidth={4}
                tone={itemTone}
              >
                <span
                  className={cn(
                    "font-mono text-[0.5625rem] font-semibold leading-none tabular-nums",
                    TONE_TEXT[itemTone]
                  )}
                >
                  {pct > 999 ? "∞" : pct}
                </span>
              </CircularMeter>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-body font-medium">
                    {budget.name}
                  </span>
                  <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${Math.min(Math.max(budget.ratio, 0), 1) * 100}%`,
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
