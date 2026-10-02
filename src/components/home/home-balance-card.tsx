"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type {
  HomeAvailableBalance,
  MonthCashflow,
  MonthPaceStatus,
} from "@/lib/home/month-cashflow";
import { cn } from "@/lib/utils";
import { AmountText } from "@/components/patterns/amount-text";
import { MoneyFigure } from "@/components/patterns/money-figure";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface HomeBalanceCardProps {
  cashflow: MonthCashflow;
  availableBalance: HomeAvailableBalance;
  /** Applied to the In/Out line under the card, e.g. to hide it on desktop. */
  flowClassName?: string;
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
      return t("Slightly ahead", "Algo adelantado");
    case "high_pace":
      return t("High pace", "Ritmo alto");
    default:
      return null;
  }
}

/**
 * Home's hero: the available balance printed on a physical accent card, with
 * two more cards stacked behind it for depth. The card carries the one figure
 * that matters — what can be spent — plus the daily guide and the month's
 * pace. Income and outflow sit quietly beneath it.
 *
 * The carried cash figure and the monthly plan pace remain separate
 * calculations; this only presents them.
 */
export function HomeBalanceCard({
  cashflow,
  availableBalance,
  flowClassName,
  className,
}: HomeBalanceCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

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
  const days = cashflow.daysRemaining;
  const guide =
    dailyLabel == null
      ? availableBalance.source === "tracked"
        ? t("Carried balance", "Saldo acumulado")
        : t("This month", "Este mes")
      : t(
          `${dailyLabel} a day for ${days} ${days === 1 ? "day" : "days"}`,
          `${dailyLabel} al día por ${days} ${days === 1 ? "día" : "días"}`
        );

  return (
    <section
      aria-label={t("Available balance", "Saldo disponible")}
      className={className}
    >
      <div className="relative pb-[1.125rem]">
        {/* Two cards behind the front one. Depth only — they hold no data. */}
        <div
          aria-hidden
          className="absolute inset-x-9 bottom-0 top-6 rounded-2xl bg-card ring-1 ring-inset ring-border"
        />
        <div
          aria-hidden
          className="absolute inset-x-[1.125rem] bottom-[0.5625rem] top-3 rounded-2xl bg-surface-2 ring-1 ring-inset ring-border"
        />
        <div className="balance-card relative flex min-h-[12.75rem] flex-col overflow-hidden rounded-2xl px-[1.375rem] pb-4 pt-[1.125rem]">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22] mix-blend-soft-light"
          >
            <filter id="balance-card-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#balance-card-grain)" />
          </svg>

          <div className="relative flex items-start justify-between">
            <p className="text-sm font-bold text-on-coral/75">
              {t("Available", "Disponible")}
            </p>
            {/* A card chip, as decoration: it makes the surface read as a card. */}
            <span
              aria-hidden
              className="relative h-7 w-[2.375rem] rounded-md bg-gradient-to-br from-white/55 via-white/15 to-black/10 ring-1 ring-inset ring-black/15"
            >
              <span className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
            </span>
          </div>

          <MoneyFigure
            amount={availableBalance.amount}
            currency={baseCurrency}
            minorClassName="text-on-coral/75"
            className="relative mt-3"
          />

          <div className="relative mt-auto flex items-center justify-between gap-3 pt-4 text-detail font-bold text-on-coral/75">
            <span className="min-w-0 truncate">{guide}</span>
            {status ? <span className="shrink-0">{status}</span> : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm",
          flowClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ArrowDownLeft
            aria-hidden
            className="h-4 w-4 shrink-0 text-income"
            strokeWidth={2.4}
          />
          <span className="text-muted-foreground">{t("In", "Entra")}</span>
          {cashflow.monthlyIncome == null ? (
            <span className="font-bold">—</span>
          ) : (
            <AmountText
              amount={cashflow.monthlyIncome}
              currency={baseCurrency}
              className="text-sm font-bold"
            />
          )}
        </span>
        <span aria-hidden className="hidden h-4 w-px shrink-0 bg-border min-[22rem]:block" />
        <span className="flex min-w-0 items-center gap-1.5">
          <ArrowUpRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={2.4}
          />
          <span className="text-muted-foreground">{t("Out", "Sale")}</span>
          <AmountText
            amount={cashflow.actualOutflows}
            currency={baseCurrency}
            className="text-sm font-bold"
          />
        </span>
      </div>
    </section>
  );
}
