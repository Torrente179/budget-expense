"use client";

import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import type { MonthCashflow } from "@/lib/home/month-cashflow";
import { formatUsagePercent } from "@/lib/home/month-cashflow";
import { cn, formatCurrency } from "@/lib/utils";
import {
  HERO_ACCENT,
  HERO_ACCENT_NEGATIVE,
  HERO_ACCENT_WARNING,
  HERO_ICON_TILE,
  HERO_SURFACE,
  HERO_TILE,
} from "@/components/patterns/hero-surface";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface BudgetSummaryHeroProps {
  cashflow: MonthCashflow;
  dayOfMonth: number;
  daysInMonth: number;
}

/**
 * Budget tab hero: remaining inside this month's plan + daily/pace chips.
 */
export function BudgetSummaryHero({
  cashflow,
  dayOfMonth,
  daysInMonth,
}: BudgetSummaryHeroProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  const remainingLabel =
    cashflow.remaining == null
      ? "—"
      : formatCurrency(cashflow.remaining, baseCurrency, intlLocale);
  const spentLabel = formatCurrency(
    cashflow.actualOutflows,
    baseCurrency,
    intlLocale
  );
  const incomeLabel =
    cashflow.monthlyIncome == null
      ? "—"
      : formatCurrency(cashflow.monthlyIncome, baseCurrency, intlLocale);
  const dailyLabel =
    cashflow.dailyAvailable == null
      ? null
      : new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }).format(Math.round(cashflow.dailyAvailable));

  const barFill =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? 0
      : Math.min(Math.max(cashflow.usedRatio, 0), 1) * 100;

  /* The bar clamps at 100%, so its color carries the overspend instead. */
  const barColor =
    cashflow.paceStatus === "over_plan"
      ? HERO_ACCENT_NEGATIVE
      : cashflow.paceStatus === "high_pace"
        ? HERO_ACCENT_WARNING
        : HERO_ACCENT;

  const statusCopy = (() => {
    switch (cashflow.paceStatus) {
      case "over_plan":
        return {
          title: t("Over plan", "Plan superado"),
          detail: t("Spending exceeds income", "El gasto supera el ingreso"),
        };
      case "on_track":
        return {
          title: t("On track", "Dentro del plan"),
          detail: t("You're on a good path", "Vas por buen camino"),
        };
      case "slightly_ahead":
        return {
          title: t("Slightly ahead", "Ligeramente adelantado"),
          detail: t("A bit ahead of the calendar", "Un poco delante del calendario"),
        };
      case "high_pace":
        return {
          title: t("High spending pace", "Ritmo de gasto alto"),
          detail: t("Slow down to stay on plan", "Frena para mantener el plan"),
        };
      default:
        return {
          title: t("Set monthly income", "Define el ingreso del mes"),
          detail: t("Plan income unlocks this view", "El ingreso del plan desbloquea esta vista"),
        };
    }
  })();

  return (
    <section className={HERO_SURFACE}>
      <div className="relative grid gap-3.5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.85fr)] lg:items-center lg:gap-5">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-[0.8125rem] font-medium text-white/55">
              {t(
                "Remaining in this month's plan",
                "Restante en el plan de este mes"
              )}
            </p>
            <p className="up-figure mt-0.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.035em] tabular-nums">
              {remainingLabel}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="up-track-dark relative h-1 overflow-hidden rounded-sm">
              <div
                className="absolute inset-y-0 left-0 rounded-sm transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
                style={{ width: `${barFill}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="text-[0.75rem] text-white/55">
              <span className="font-mono tabular-nums">{spentLabel}</span>{" "}
              {t("spent of", "gastados de")}{" "}
              <span className="font-mono tabular-nums">{incomeLabel}</span>
              {" · "}
              {t(
                `day ${dayOfMonth} of ${daysInMonth}`,
                `día ${dayOfMonth} de ${daysInMonth}`
              )}
              {cashflow.usedRatio != null && (
                <>
                  {" · "}
                  {formatUsagePercent(cashflow.usedRatio)}%
                </>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {dailyLabel != null && (
            <div
              className={cn(
                "flex items-start gap-2.5 rounded-xl px-3 py-2.5",
                HERO_TILE
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  HERO_ICON_TILE
                )}
              >
                <Gauge className="h-3.5 w-3.5 text-white" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {dailyLabel} {t("/ day", "al día")}
                </p>
                <p className="text-[0.6875rem] text-white/55">
                  {t("To stay on plan", "Para mantenerte en el plan")}
                </p>
              </div>
            </div>
          )}
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl px-3 py-2.5",
              HERO_TILE
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                HERO_ICON_TILE
              )}
            >
              {cashflow.paceStatus === "over_plan" ||
              cashflow.paceStatus === "high_pace" ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
              ) : (
                <CheckCircle2
                  className="h-3.5 w-3.5"
                  style={{ color: HERO_ACCENT }}
                />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{statusCopy.title}</p>
              <p className="text-[0.6875rem] text-white/55">
                {statusCopy.detail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
