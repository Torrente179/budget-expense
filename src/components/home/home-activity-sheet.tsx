"use client";

import Link from "next/link";
import { ArrowUpDown, Compass } from "lucide-react";
import { AmountText } from "@/components/patterns/amount-text";
import { MerchantMark } from "@/components/patterns/merchant-mark";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { ReactNode } from "react";

export interface HomeFeedMovement {
  id: string;
  kind: "expense" | "income";
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  category: { icon: string; color: string } | null;
  needsReview: boolean;
  alt: boolean;
}

export interface HomeFeedDay {
  date: string;
  label: string;
  movements: HomeFeedMovement[];
}

export interface HomeUpcomingPayment {
  id: string;
  title: string;
  dueLabel: string;
  amount: number;
  currency: string;
  category: { icon: string; color: string } | null;
}

interface HomeActivitySheetProps {
  feedDays: HomeFeedDay[];
  upcoming: HomeUpcomingPayment[];
  showSetupPrompt?: boolean;
  className?: string;
}

/** A day's heading: its name on the left, what moved that day on the right. */
function FeedHeading({
  label,
  detail,
  className,
}: {
  label: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-6 items-baseline justify-between gap-3 px-4",
        className
      )}
    >
      <h2 className="text-sm font-extrabold capitalize text-muted-foreground">
        {label}
      </h2>
      {detail ? (
        <span className="min-w-0 truncate text-detail font-semibold text-muted-foreground">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Home's feed: what is about to leave, then what moved, day by day.
 *
 * The next scheduled payment leads, drawn with an outlined mark because it has
 * not happened yet. Each day after it carries its own total of money out and
 * in, so the feed can be read at the heading level without opening anything.
 */
export function HomeActivitySheet({
  feedDays,
  upcoming,
  showSetupPrompt = false,
  className,
}: HomeActivitySheetProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const nextPayment = upcoming[0] ?? null;

  function dayTotals(movements: HomeFeedMovement[]) {
    let out = 0;
    let income = 0;
    for (const movement of movements) {
      const value = Math.abs(convert(movement.amount, movement.currency));
      if (movement.kind === "income") income += value;
      else out += value;
    }
    const parts: string[] = [];
    if (out > 0) {
      const amount = formatCurrency(out, baseCurrency, intlLocale);
      parts.push(t(`${amount} out`, `${amount} sale`));
    }
    if (income > 0) {
      const amount = formatCurrency(income, baseCurrency, intlLocale);
      parts.push(t(`${amount} in`, `${amount} entra`));
    }
    return parts.join(" · ");
  }

  return (
    <section className={cn("min-w-0 text-foreground", className)}>
      {showSetupPrompt ? (
        <Link
          href="/onboarding"
          className="mx-4 mb-5 flex min-h-14 items-center gap-3 rounded-2xl bg-info-subtle px-4 py-2.5 transition-colors hover:bg-info/20"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info">
            <Compass className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-bold">
              {t("Finish your setup", "Termina tu configuración")}
            </span>
            <span className="block truncate text-caption text-muted-foreground">
              {t(
                "Income, recurring costs, debts, and goals — skip anytime.",
                "Ingresos, gastos fijos, deudas y metas — puedes saltarlo."
              )}
            </span>
          </span>
          <span className="shrink-0 text-caption font-bold text-info">
            {t("Continue", "Continuar")}
          </span>
        </Link>
      ) : null}

      {nextPayment ? (
        <>
          <FeedHeading
            label={t("Upcoming", "Próximos")}
            detail={
              upcoming.length > 1
                ? t(
                    `${upcoming.length} scheduled`,
                    `${upcoming.length} programados`
                  )
                : undefined
            }
          />
          <Link
            href="/movements/recurring"
            className="flex min-h-16 items-center gap-3.5 px-4 py-2 transition-colors hover:bg-accent/50"
          >
            <MerchantMark title={nextPayment.title} outlined />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold leading-snug">
                {nextPayment.title}
              </span>
              <span className="mt-px block truncate text-detail font-medium text-muted-foreground">
                {t(
                  `Scheduled · ${nextPayment.dueLabel}`,
                  `Programado · ${nextPayment.dueLabel}`
                )}
              </span>
            </span>
            <AmountText
              amount={nextPayment.amount}
              currency={nextPayment.currency}
              tone="muted"
              showOriginal
              className="shrink-0 text-right text-base font-bold"
            />
          </Link>
        </>
      ) : null}

      {feedDays.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            icon={ArrowUpDown}
            title={t("No movements yet", "Aún sin movimientos")}
            description={t(
              "Add your first expense with the + button.",
              "Agrega tu primer gasto con el botón +."
            )}
          />
        </div>
      ) : (
        <>
          <div className="up-list-stagger">
            {feedDays.flatMap((day, index) => [
              <FeedHeading
                key={`date-${day.date}`}
                label={day.label}
                detail={dayTotals(day.movements)}
                className={index > 0 || nextPayment ? "mt-3.5" : undefined}
              />,
              ...day.movements.map((movement) => (
                <TransactionRow
                  key={`${movement.kind}-${movement.id}`}
                  title={movement.title}
                  subtitle={movement.subtitle}
                  amount={movement.amount}
                  currency={movement.currency}
                  kind={movement.kind}
                  category={movement.category}
                  needsReview={movement.needsReview}
                />
              )),
            ])}
          </div>
          <Link
            href="/movements"
            className="mx-4 mt-3 flex min-h-11 items-center justify-center rounded-full border border-border bg-card text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            {t("See all movements", "Ver todos los movimientos")}
          </Link>
        </>
      )}
    </section>
  );
}
