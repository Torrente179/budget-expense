"use client";

import { ArrowDownLeft, ArrowUpRight, CalendarDays, Wallet } from "lucide-react";
import {
  formatUsagePercent,
  type HomeAvailableBalance,
  type MonthCashflow,
  type MonthPaceStatus,
} from "@/lib/home/month-cashflow";
import { cn, formatCurrency } from "@/lib/utils";
import {
  HeroSheen,
  HERO_ACCENT,
  HERO_ICON_TILE,
  HERO_RULE,
  HERO_SURFACE,
} from "@/components/patterns/hero-surface";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

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
          stroke="rgba(255,255,255,0.12)"
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
        <span className="mt-0.5 max-w-[4.5rem] text-[0.625rem] font-medium leading-tight text-white/55">
          {t("of budget used", "del presupuesto utilizado")}
        </span>
      </div>
    </div>
  );
}

/**
 * Home hero: real carried cash when tracked, with month-only plan pace kept as
 * supporting context. Mobile matches the stacked mockup; desktop keeps the
 * horizontal metrics row.
 */
export function HomeSummaryCard({
  cashflow,
  availableBalance,
  monthEndLabel,
  className,
}: HomeSummaryCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  const remainingLabel =
    availableBalance.amount == null
      ? "—"
      : formatCurrency(availableBalance.amount, baseCurrency, intlLocale);
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
    availableBalance.dailyAvailable == null
      ? null
      : new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        }).format(Math.round(availableBalance.dailyAvailable));

  const usesTrackedBalance = availableBalance.source === "tracked";
  const balanceCaption = usesTrackedBalance
    ? t(
        "carried available balance",
        "saldo disponible acumulado"
      )
    : t("available this month", "disponibles este mes");

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
    <section className={cn(HERO_SURFACE, className)}>
      <HeroSheen />
      {/* Mobile wallet watermark */}
      <Wallet
        aria-hidden
        className="pointer-events-none absolute -right-2 top-2 h-20 w-20 text-white/[0.05] lg:hidden"
        strokeWidth={1}
      />

      {/* —— Mobile layout —— */}
      <div className="relative space-y-3.5 p-4 lg:hidden">
        <div>
          <p className="text-[0.8125rem] font-medium text-white/55">
            {t("You have", "Te quedan")}
          </p>
          <p className="chrome-figure mt-0.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.035em] tabular-nums">
            {remainingLabel}
          </p>
          <p className="mt-1 text-[0.8125rem] font-medium text-white/55">
            {balanceCaption}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="groove-dark relative h-1 overflow-hidden rounded-sm">
            <div
              className="groove-fill absolute inset-y-0 left-0 rounded-sm transition-[width] duration-700 ease-out"
              style={{ width: `${barFill}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[0.6875rem] text-white/55">
            <span>
              {usedPct !== "—"
                ? t(`${usedPct}% spent`, `${usedPct}% gastado`)
                : t("Spent", "Gastado")}
            </span>
            <span>
              {availablePct != null
                ? t(
                    `${availablePct}% left in plan`,
                    `${availablePct}% restante del plan`
                  )
                : t("Available", "Disponible")}
            </span>
          </div>
        </div>

        <div className={cn("grid grid-cols-2 gap-0 border-t pt-3", HERO_RULE)}>
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  HERO_ICON_TILE
                )}
              >
                <ArrowDownLeft
                  className="h-3 w-3"
                  style={{ color: HERO_ACCENT }}
                />
              </span>
              <span className="text-[0.75rem] font-medium text-white/55">
                {t("Income", "Ingresos")}
              </span>
            </div>
            <p
              className="mt-1 font-mono text-sm font-bold tracking-[-0.02em] tabular-nums"
              style={{ color: HERO_ACCENT }}
            >
              {incomeLabel}
            </p>
          </div>
          <div className={cn("min-w-0 border-l pl-3", HERO_RULE)}>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  HERO_ICON_TILE
                )}
              >
                <ArrowUpRight className="h-3 w-3 text-white" />
              </span>
              <span className="text-[0.75rem] font-medium text-white/55">
                {t("Spent", "Gastado")}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-bold tracking-[-0.02em] tabular-nums text-white">
              {spentLabel}
            </p>
          </div>
        </div>

        {dailyLabel != null && (
          <div className={cn("flex items-center gap-2 border-t pt-3", HERO_RULE)}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                HERO_ICON_TILE
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-white" />
            </span>
            <p className="text-[0.75rem] leading-snug text-white/70">
              {usesTrackedBalance
                ? t(
                    `${dailyLabel} / day from this balance until ${monthEndLabel}`,
                    `${dailyLabel} al día de este saldo hasta el ${monthEndLabel}`
                  )
                : t(
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
            <p className="text-[0.8125rem] font-medium text-white/55">
              {t("You have", "Te quedan")}
            </p>
            <p className="chrome-figure mt-0.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.035em] tabular-nums">
              {remainingLabel}
            </p>
            <p className="mt-1 text-[0.8125rem] font-medium text-white/55">
              {balanceCaption}
            </p>
          </div>

          <div
            aria-hidden
            className="mx-4 h-10 w-px shrink-0 bg-white/12 xl:mx-5"
          />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-white/55">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: HERO_ACCENT }}
              />
              {t("Income received", "Ingresos recibidos")}
            </p>
            <p
              className="mt-1 font-mono text-base font-bold tracking-[-0.02em] tabular-nums"
              style={{ color: HERO_ACCENT }}
            >
              {incomeLabel}
            </p>
          </div>

          <div
            aria-hidden
            className="mx-4 h-10 w-px shrink-0 bg-white/12 xl:mx-5"
          />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-white/55">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70"
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
          <div className="groove-dark relative h-1 overflow-visible rounded-sm">
            <div
              className="groove-fill absolute inset-y-0 left-0 rounded-sm transition-[width] duration-700 ease-out"
              style={{ width: `${barFill}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 z-10 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-black/60"
              style={{ left: `${paceMark}%` }}
              title={t("Month progress", "Progreso del mes")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[0.75rem] text-white/55">
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

        <div className={cn("flex flex-wrap items-center gap-2 border-t pt-3", HERO_RULE)}>
          {dailyLabel != null && (
            <p className="inline-flex items-center gap-2 text-[0.75rem] text-white/70">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  HERO_ICON_TILE
                )}
              >
                <CalendarDays className="h-3.5 w-3.5 text-white" />
              </span>
              <span>
                {usesTrackedBalance
                  ? t(
                      `About ${dailyLabel} / day from this balance until ${monthEndLabel}`,
                      `Aproximadamente ${dailyLabel} al día de este saldo hasta el ${monthEndLabel}`
                    )
                  : t(
                      `About ${dailyLabel} / day until ${monthEndLabel}`,
                      `Aproximadamente ${dailyLabel} al día hasta el ${monthEndLabel}`
                    )}
              </span>
            </p>
          )}
          {status && (
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[0.625rem] font-medium text-white/70 ring-1 ring-white/10">
              {status}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
