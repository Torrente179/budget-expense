"use client";

import { ArrowDownLeft, ArrowUpRight, CalendarDays, Wallet } from "lucide-react";
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

/** Vibrant blue from the mobile hero mockup — shared with desktop. */
const HERO_GRADIENT =
  "bg-[linear-gradient(160deg,#3b82f6_0%,#2563eb_42%,#1d4ed8_100%)] dark:bg-[linear-gradient(160deg,#1e40af_0%,#1d4ed8_45%,#1e3a8a_100%)]";

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
  size = 88,
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
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <span className="font-mono text-[1.25rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-white">
          {pct}
          {pct !== "—" && <span className="text-[0.62em]">%</span>}
        </span>
        <span className="mt-0.5 max-w-[4.5rem] text-[0.625rem] font-medium leading-tight text-white/85">
          {t("of budget used", "del presupuesto utilizado")}
        </span>
      </div>
    </div>
  );
}

/**
 * Home hero: month remaining = income − outflows, with pace bar + daily guide.
 * Mobile matches the stacked mockup; desktop keeps the horizontal metrics row.
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
        HERO_GRADIENT,
        className
      )}
    >
      {/* Mobile wallet watermark */}
      <Wallet
        aria-hidden
        className="pointer-events-none absolute -right-2 top-2 h-20 w-20 text-white/[0.08] lg:hidden"
        strokeWidth={1}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 bottom-0 hidden h-32 w-32 rounded-full bg-white/10 blur-3xl lg:block"
      />

      {/* —— Mobile layout —— */}
      <div className="relative space-y-3.5 p-4 lg:hidden">
        <div>
          <p className="text-[0.8125rem] font-medium text-white/90">
            {t("You have", "Te quedan")}
          </p>
          <p className="mt-0.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.035em] tabular-nums">
            {remainingLabel}
          </p>
          <p className="mt-1 text-[0.8125rem] font-medium text-white/85">
            {t("available this month", "disponibles este mes")}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="relative h-2 overflow-hidden rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-700 ease-out"
              style={{ width: `${barFill}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[0.6875rem] text-white/90">
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
        </div>

        <div className="grid grid-cols-2 gap-0 border-t border-white/20 pt-3">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
              </span>
              <span className="text-[0.75rem] font-medium text-white/85">
                {t("Income", "Ingresos")}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-bold tracking-[-0.02em] tabular-nums text-[#86efac]">
              {incomeLabel}
            </p>
          </div>
          <div className="min-w-0 border-l border-white/20 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                <ArrowUpRight className="h-3 w-3 text-slate-700" />
              </span>
              <span className="text-[0.75rem] font-medium text-white/85">
                {t("Spent", "Gastado")}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-bold tracking-[-0.02em] tabular-nums text-white">
              {spentLabel}
            </p>
          </div>
        </div>

        {dailyLabel != null && (
          <div className="flex items-center gap-2 border-t border-white/20 pt-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <CalendarDays className="h-3.5 w-3.5 text-white" />
            </span>
            <p className="text-[0.75rem] leading-snug text-white/95">
              {t(
                `${dailyLabel} / day until ${monthEndLabel}`,
                `${dailyLabel} al día hasta el ${monthEndLabel}`
              )}
            </p>
          </div>
        )}
      </div>

      {/* —— Desktop layout —— */}
      <div className="relative hidden space-y-3.5 p-5 lg:block">
        <div className="flex flex-row items-center">
          <div className="min-w-0 shrink-0">
            <p className="text-[0.8125rem] font-medium text-white/90">
              {t("You have", "Te quedan")}
            </p>
            <p className="mt-0.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.035em] tabular-nums">
              {remainingLabel}
            </p>
            <p className="mt-1 text-[0.8125rem] font-medium text-white/80">
              {t("available this month", "disponibles este mes")}
            </p>
          </div>

          <div
            aria-hidden
            className="mx-4 h-10 w-px shrink-0 bg-white/25 xl:mx-5"
          />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-white/85">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#86efac]"
              />
              {t("Income received", "Ingresos recibidos")}
            </p>
            <p className="mt-1 font-mono text-base font-bold tracking-[-0.02em] tabular-nums text-[#86efac]">
              {incomeLabel}
            </p>
          </div>

          <div
            aria-hidden
            className="mx-4 h-10 w-px shrink-0 bg-white/25 xl:mx-5"
          />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-white/85">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/90"
              />
              {t("You've spent", "Has gastado")}
            </p>
            <p className="mt-1 font-mono text-base font-bold tracking-[-0.02em] tabular-nums text-white">
              {spentLabel}
            </p>
          </div>

          <div className="ml-auto shrink-0 pl-3">
            <HeroRing usedRatio={cashflow.usedRatio} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="relative h-2 overflow-visible rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-700 ease-out"
              style={{ width: `${barFill}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 z-10 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-blue-700/40"
              style={{ left: `${paceMark}%` }}
              title={t("Month progress", "Progreso del mes")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[0.75rem] text-white/85">
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

        <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-3">
          {dailyLabel != null && (
            <p className="inline-flex items-center gap-2 text-[0.75rem] text-white/95">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <CalendarDays className="h-3.5 w-3.5 text-white" />
              </span>
              <span>
                {t(
                  `About ${dailyLabel} / day until ${monthEndLabel}`,
                  `Aproximadamente ${dailyLabel} al día hasta el ${monthEndLabel}`
                )}
              </span>
            </p>
          )}
          {status && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.625rem] font-medium text-white/90">
              {status}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
