"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Gauge,
} from "lucide-react";
import {
  formatUsagePercent,
  type HomeAvailableBalance,
  type MonthCashflow,
  type MonthPaceStatus,
} from "@/lib/home/month-cashflow";
import { cn } from "@/lib/utils";
import { AmountText } from "@/components/patterns/amount-text";
import {
  HERO_ACCENT,
  HERO_RULE,
  HERO_SURFACE,
} from "@/components/patterns/hero-surface";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { ReactNode } from "react";

interface HomeSummaryCardProps {
  cashflow: MonthCashflow;
  availableBalance: HomeAvailableBalance;
  /** Last calendar day label, e.g. "31 de julio" / "July 31". */
  monthEndLabel: string;
  className?: string;
}

function paceStatusLabel(
  status: MonthPaceStatus,
  t: (en: string, es: string) => string
): string | null {
  switch (status) {
    case "over_plan":
      return t("Over plan", "Plan superado");
    case "on_track":
      return t("On track", "Dentro del plan");
    case "slightly_ahead":
      return t("Slightly ahead", "Ligeramente adelantado");
    case "high_pace":
      return t("High spending pace", "Ritmo de gasto alto");
    default:
      return null;
  }
}

function SummaryMetric({
  icon,
  label,
  value,
  detail,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-3 py-3", className)}>
      <div className="flex items-center gap-1.5 text-caption font-medium text-white/55">
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 min-w-0 font-mono text-[clamp(0.75rem,3.4vw,0.9375rem)] font-bold leading-tight tabular-nums text-white">
        {value}
      </div>
      {detail ? (
        <p className="mt-0.5 truncate text-label text-white/50">{detail}</p>
      ) : null}
    </div>
  );
}

/**
 * The Home chrome: one centred available-balance figure, followed by a compact
 * month-context strip. The carried cash figure and monthly plan pace remain
 * deliberately separate calculations.
 */
export function HomeSummaryCard({
  cashflow,
  availableBalance,
  monthEndLabel,
  className,
}: HomeSummaryCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  const usesTrackedBalance = availableBalance.source === "tracked";
  const balanceCaption = usesTrackedBalance
    ? t("carried available balance", "saldo disponible acumulado")
    : t("available this month", "disponibles este mes");
  const usedPct = formatUsagePercent(cashflow.usedRatio);
  const leftPct =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? null
      : formatUsagePercent(1 - Math.min(Math.max(cashflow.usedRatio, 0), 1));
  const barFill =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? 0
      : Math.min(Math.max(cashflow.usedRatio, 0), 1) * 100;
  const paceMark = Math.min(Math.max(cashflow.monthProgress, 0), 1) * 100;
  const status = paceStatusLabel(cashflow.paceStatus, t);
  const dailyLabel =
    availableBalance.dailyAvailable == null
      ? null
      : new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }).format(Math.round(availableBalance.dailyAvailable));

  return (
    <section className={cn(HERO_SURFACE, className)}>
      <div className="px-4 pb-7 pt-8 text-center sm:px-5 sm:pb-8 sm:pt-10">
        <div className="flex min-h-11 items-center justify-center">
          {availableBalance.amount == null ? (
            <span className="up-figure font-mono text-display font-bold leading-none tabular-nums">
              —
            </span>
          ) : (
            <AmountText
              amount={availableBalance.amount}
              currency={baseCurrency}
              size="display"
              className="up-figure text-display font-bold leading-none text-coral"
            />
          )}
        </div>
        <p className="mt-2 text-body font-semibold text-coral">
          {t("Available", "Disponible")}
        </p>
        <p className="mt-0.5 text-caption text-white/50">{balanceCaption}</p>
      </div>

      <div className={cn("border-t", HERO_RULE)}>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <SummaryMetric
            icon={
              <ArrowDownLeft
                className="h-3.5 w-3.5"
                style={{ color: HERO_ACCENT }}
              />
            }
            label={t("Income", "Ingresos")}
            value={
              cashflow.monthlyIncome == null ? (
                "—"
              ) : (
                <AmountText
                  amount={cashflow.monthlyIncome}
                  currency={baseCurrency}
                  size="body"
                  className="font-bold text-[#3ddc97]"
                />
              )
            }
            detail={t("this month", "este mes")}
            className="border-b border-white/10 sm:border-b-0"
          />
          <SummaryMetric
            icon={<ArrowUpRight className="h-3.5 w-3.5 text-white/70" />}
            label={t("Spent", "Gastado")}
            value={
              <AmountText
                amount={cashflow.actualOutflows}
                currency={baseCurrency}
                size="body"
                className="font-bold text-white"
              />
            }
            detail={t("this month", "este mes")}
            className="border-b border-l border-white/10 sm:border-b-0"
          />
          <SummaryMetric
            icon={<CalendarDays className="h-3.5 w-3.5 text-white/70" />}
            label={t("Daily guide", "Guía diaria")}
            value={dailyLabel ?? "—"}
            detail={t(`until ${monthEndLabel}`, `hasta el ${monthEndLabel}`)}
            className="sm:border-l sm:border-white/10"
          />
          <SummaryMetric
            icon={<Gauge className="h-3.5 w-3.5 text-white/70" />}
            label={t("Plan pace", "Ritmo del plan")}
            value={usedPct === "—" ? "—" : `${usedPct}%`}
            detail={status ?? t("No monthly plan", "Sin plan mensual")}
            className="border-l border-white/10"
          />
        </div>

        <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">
          <div className="up-track-dark relative h-1 overflow-visible rounded-sm">
            <div
              className="absolute inset-y-0 left-0 rounded-sm bg-coral transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
              style={{ width: `${barFill}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 z-10 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-black/60"
              style={{ left: `${paceMark}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 text-label text-white/50">
            <span>
              {usedPct === "—"
                ? t("Plan unavailable", "Plan no disponible")
                : t(
                    `${usedPct}% spent · ${leftPct}% left`,
                    `${usedPct}% gastado · ${leftPct}% restante`
                  )}
            </span>
            <span>
              {t(
                `${Math.round(paceMark)}% of month`,
                `${Math.round(paceMark)}% del mes`
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
