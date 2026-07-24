"use client";

import { CalendarDays } from "lucide-react";
import {
  formatUsagePercent,
  type MonthCashflow,
  type MonthPaceStatus,
} from "@/lib/home/month-cashflow";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface HomeSummaryCardProps {
  cashflow: MonthCashflow;
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

function HeroRing({
  usedRatio,
  size = 104,
}: {
  usedRatio: number | null;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled =
    usedRatio == null || !Number.isFinite(usedRatio)
      ? 0
      : Math.min(Math.max(usedRatio, 0), 1);
  const dashOffset = circumference * (1 - filled);
  const pct = formatUsagePercent(usedRatio);
  const { t } = useLocale();

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden={usedRatio == null}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#34d399"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-white">
          {pct}
          {pct !== "—" && <span className="text-[0.55em]">%</span>}
        </span>
        <span className="mt-1 max-w-[4.5rem] text-[0.625rem] leading-tight text-white/70">
          {t("of budget used", "del presupuesto utilizado")}
        </span>
      </div>
    </div>
  );
}

/**
 * Home hero: month remaining = income − outflows, with pace bar + daily guide.
 */
export function HomeSummaryCard({
  cashflow,
  monthEndLabel,
  className,
}: HomeSummaryCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  const remainingLabel =
    cashflow.remaining == null
      ? "—"
      : formatCurrency(cashflow.remaining, baseCurrency, intlLocale);
  const incomeLabel =
    cashflow.monthlyIncome == null
      ? "—"
      : formatCurrency(cashflow.monthlyIncome, baseCurrency, intlLocale);
  const spentLabel = formatCurrency(
    cashflow.actualOutflows,
    baseCurrency,
    intlLocale
  );
  const dailyLabel =
    cashflow.dailyAvailable == null
      ? null
      : new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }).format(Math.round(cashflow.dailyAvailable));

  const usedPct = formatUsagePercent(cashflow.usedRatio);
  const availablePct =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? null
      : formatUsagePercent(1 - Math.min(Math.max(cashflow.usedRatio, 0), 1));
  const barFill =
    cashflow.usedRatio == null || !Number.isFinite(cashflow.usedRatio)
      ? 0
      : Math.min(Math.max(cashflow.usedRatio, 0), 1) * 100;
  const paceMark = Math.min(Math.max(cashflow.monthProgress, 0), 1) * 100;
  const status = paceStatusLabel(cashflow.paceStatus, t);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl text-white shadow-2",
        "bg-[linear-gradient(135deg,#1b3a6b_0%,#244f8a_48%,#1e4a7c_100%)]",
        "dark:bg-[linear-gradient(135deg,#152a42_0%,#1a3a5c_50%,#14304d_100%)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 top-6 h-28 w-28 rounded-full border border-white/10"
      />

      <div className="relative space-y-5 p-5 sm:p-6">
        {/* Top: remaining + income/spent + ring */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-caption text-white/75">
                {t("You have", "Te quedan")}
              </p>
              <p className="mt-0.5 font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[2rem]">
                {remainingLabel}
              </p>
              <p className="mt-1.5 text-caption text-white/70">
                {t("available this month", "disponibles este mes")}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:gap-x-8">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[0.6875rem] text-white/65">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  />
                  {t("Income received", "Ingresos recibidos")}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-emerald-300">
                  {incomeLabel}
                </p>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[0.6875rem] text-white/65">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-white/80"
                  />
                  {t("You've spent", "Has gastado")}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
                  {spentLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:block">
            <HeroRing usedRatio={cashflow.usedRatio} />
          </div>
        </div>

        {/* Pace bar */}
        <div className="space-y-2">
          <div className="relative h-2.5 overflow-visible rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-[width] duration-700 ease-out"
              style={{ width: `${barFill}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 z-10 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm"
              style={{ left: `${paceMark}%` }}
              title={t("Month progress", "Progreso del mes")}
            />
          </div>

          {/* Mobile labels: % spent / % available */}
          <div className="flex items-center justify-between gap-3 text-[0.6875rem] text-white/75 sm:hidden">
            <span>
              {usedPct !== "—"
                ? t(`${usedPct}% spent`, `${usedPct}% gastado`)
                : t("Spent", "Gastado")}
            </span>
            <span>
              {availablePct != null
                ? t(
                    `${availablePct}% available`,
                    `${availablePct}% disponible`
                  )
                : t("Available", "Disponible")}
            </span>
          </div>

          {/* Desktop labels: amounts */}
          <div className="hidden items-center justify-between gap-3 text-[0.6875rem] text-white/75 sm:flex">
            <span>
              {t("Spent", "Gastado")}:{" "}
              <span className="font-mono tabular-nums text-white">
                {spentLabel}
              </span>
            </span>
            <span>
              {t("Month target", "Meta del mes")}:{" "}
              <span className="font-mono tabular-nums text-white">
                {incomeLabel}
              </span>
            </span>
          </div>
        </div>

        {/* Daily + status footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          {dailyLabel != null && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-caption text-white/90">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/70" />
              <span>
                {t(
                  `About ${dailyLabel} / day until ${monthEndLabel}`,
                  `Aproximadamente ${dailyLabel} al día hasta el ${monthEndLabel}`
                )}
              </span>
            </p>
          )}
          {status && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6875rem] font-medium text-white/85">
              {status}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
