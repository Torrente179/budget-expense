"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import type { MonthCashflow, MonthPaceStatus } from "@/lib/home/month-cashflow";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { ReactNode } from "react";

interface HomeMonthPanelProps {
  cashflow: MonthCashflow;
  className?: string;
}

function paceSentence(
  status: MonthPaceStatus,
  t: (en: string, es: string) => string
): string {
  switch (status) {
    case "over_plan":
      return t(
        "Spending is over this month's income",
        "El gasto supera el ingreso del mes"
      );
    case "on_track":
      return t("On track for the month", "Dentro del plan del mes");
    case "slightly_ahead":
      return t("Slightly ahead of pace", "Algo por delante del ritmo");
    case "high_pace":
      return t(
        "Spending faster than the month",
        "Gastando más rápido que el mes"
      );
    default:
      return t(
        "Set a monthly income to see pace",
        "Define un ingreso mensual para ver el ritmo"
      );
  }
}

function Stat({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-detail font-semibold text-muted-foreground">
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate text-2xl font-extrabold tracking-tight tabular-nums",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Desktop's companion to the balance card: the month in three figures and one
 * pace bar. On a phone the card's own footer and the In/Out line carry this;
 * a wide screen has room to say it once, beside the card, at full size.
 *
 * The bar fills with what has been spent of the month's income; the tick marks
 * how far through the month today is. Fill past the tick means spending is
 * running ahead of the calendar.
 */
export function HomeMonthPanel({ cashflow, className }: HomeMonthPanelProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const money = (value: number | null) =>
    value == null ? "—" : formatCurrency(value, baseCurrency, intlLocale);

  const fill =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? 0
      : Math.min(Math.max(cashflow.usedRatio, 0), 1) * 100;
  const mark = Math.min(Math.max(cashflow.monthProgress, 0), 1) * 100;
  const over = cashflow.paceStatus === "over_plan";
  const days = cashflow.daysRemaining;
  const daily =
    cashflow.dailyAvailable == null
      ? null
      : new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }).format(Math.round(cashflow.dailyAvailable));

  return (
    <section
      aria-label={t("This month", "Este mes")}
      className={cn(
        "flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-inset ring-border",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body font-extrabold">
          {t("This month", "Este mes")}
        </h2>
        <p className="text-detail font-semibold text-muted-foreground">
          {t(
            `${days} ${days === 1 ? "day" : "days"} left`,
            `quedan ${days} ${days === 1 ? "día" : "días"}`
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Stat
          icon={
            <ArrowDownLeft className="h-4 w-4 text-income" strokeWidth={2.4} />
          }
          label={t("In", "Entra")}
          value={money(cashflow.monthlyIncome)}
          valueClassName="text-income"
        />
        <Stat
          icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />}
          label={t("Out", "Sale")}
          value={money(cashflow.actualOutflows)}
        />
        <Stat
          icon={<Wallet className="h-4 w-4" strokeWidth={2.2} />}
          label={t("Left in plan", "Queda en el plan")}
          value={money(cashflow.remaining)}
          valueClassName={
            cashflow.remaining != null && cashflow.remaining < 0
              ? "text-danger"
              : undefined
          }
        />
      </div>

      <div>
        <div className="relative h-2 rounded-full bg-track">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none",
              over ? "bg-danger" : "bg-coral"
            )}
            style={{ width: `${fill}%` }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
            style={{ left: `${mark}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-detail font-semibold text-muted-foreground">
          <span className={over ? "text-danger" : undefined}>
            {paceSentence(cashflow.paceStatus, t)}
          </span>
          {daily ? (
            <span className="shrink-0">
              {t(
                `${daily} a day to stay on plan`,
                `${daily} al día para seguir el plan`
              )}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
