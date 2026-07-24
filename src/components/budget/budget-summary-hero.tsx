"use client";

import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import type { MonthCashflow } from "@/lib/home/month-cashflow";
import { formatUsagePercent } from "@/lib/home/month-cashflow";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface BudgetSummaryHeroProps {
  cashflow: MonthCashflow;
  dayOfMonth: number;
  daysInMonth: number;
}

const HERO_GRADIENT =
  "bg-[linear-gradient(160deg,#3b82f6_0%,#2563eb_42%,#1d4ed8_100%)] dark:bg-[linear-gradient(160deg,#1e40af_0%,#1d4ed8_45%,#1e3a8a_100%)]";

/**
 * Budget tab hero: remaining for the rest of the month + daily/pace chips.
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
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl text-white shadow-2",
        HERO_GRADIENT
      )}
    >
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)] lg:items-center lg:gap-8">
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-[0.9375rem] font-medium text-white/90">
              {t(
                "Available for the rest of the month",
                "Disponible para el resto del mes"
              )}
            </p>
            <p className="mt-1 font-mono text-[2.25rem] font-bold leading-none tracking-[-0.035em] tabular-nums sm:text-[2.5rem]">
              {remainingLabel}
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/25">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#86efac] transition-[width] duration-700 ease-out"
                style={{ width: `${barFill}%` }}
              />
            </div>
            <p className="text-[0.8125rem] text-white/85">
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

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {dailyLabel != null && (
            <div className="flex items-start gap-3 rounded-xl bg-white/12 px-3.5 py-3 ring-1 ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Gauge className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-base font-semibold tabular-nums">
                  {dailyLabel} {t("/ day", "al día")}
                </p>
                <p className="text-caption text-white/75">
                  {t("To stay on plan", "Para mantenerte en el plan")}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-white/12 px-3.5 py-3 ring-1 ring-white/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              {cashflow.paceStatus === "over_plan" ||
              cashflow.paceStatus === "high_pace" ? (
                <AlertTriangle className="h-4 w-4 text-amber-200" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#86efac]" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold">{statusCopy.title}</p>
              <p className="text-caption text-white/75">{statusCopy.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
