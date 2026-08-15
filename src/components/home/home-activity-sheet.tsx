"use client";

import Link from "next/link";
import { ArrowUpDown, ChevronRight, Compass } from "lucide-react";
import { AmountText } from "@/components/patterns/amount-text";
import { MerchantMark } from "@/components/patterns/merchant-mark";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

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
  monthLabel: string;
  feedDays: HomeFeedDay[];
  upcoming: HomeUpcomingPayment[];
  showSetupPrompt?: boolean;
  className?: string;
}

/**
 * The bright transactional layer directly beneath Home's dark chrome. Upcoming
 * keeps the next recurring payment visible without displacing the dense dated
 * activity feed.
 */
export function HomeActivitySheet({
  monthLabel,
  feedDays,
  upcoming,
  showSetupPrompt = false,
  className,
}: HomeActivitySheetProps) {
  const { t } = useLocale();
  const nextPayment = upcoming[0] ?? null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-t-2xl bg-card text-foreground",
        className
      )}
    >
      <Link
        href="/movements/recurring"
        className="flex min-h-14 items-center gap-3 border-b border-border px-4 py-2.5 transition-colors hover:bg-accent/40"
      >
        <span className="shrink-0 text-body font-semibold">
          {t("Upcoming", "Próximos")}
        </span>
        {upcoming.length > 0 ? (
          <span className="flex shrink-0 items-center pl-1" aria-hidden>
            {upcoming.slice(0, 3).map((payment, index) => (
              <MerchantMark
                key={payment.id}
                title={payment.title}
                color={payment.category?.color}
                icon={payment.category?.icon}
                className={cn(
                  "h-7 w-7 rounded-full text-caption ring-2 ring-white",
                  index > 0 && "-ml-1.5"
                )}
                round
              />
            ))}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
          {nextPayment
            ? `${nextPayment.title} · ${nextPayment.dueLabel}`
            : t(
                "No recurring payments scheduled",
                "No hay pagos recurrentes programados"
              )}
        </span>
        {nextPayment ? (
          <AmountText
            amount={nextPayment.amount}
            currency={nextPayment.currency}
            size="caption"
            showOriginal
            className="shrink-0 font-semibold"
          />
        ) : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </Link>

      {showSetupPrompt ? (
        <Link
          href="/onboarding"
          className="flex min-h-14 items-center gap-3 border-b border-border bg-info-subtle/50 px-4 py-2.5 transition-colors hover:bg-info-subtle"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info">
            <Compass className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-medium">
              {t("Finish your setup", "Termina tu configuración")}
            </span>
            <span className="block truncate text-caption text-muted-foreground">
              {t(
                "Income, recurring costs, debts, and goals — skip anytime.",
                "Ingresos, gastos fijos, deudas y metas — puedes saltarlo."
              )}
            </span>
          </span>
          <span className="shrink-0 text-caption font-semibold text-info">
            {t("Continue", "Continuar")}
          </span>
        </Link>
      ) : null}

      <div className="flex items-stretch border-b border-border">
        <p className="flex min-w-0 flex-1 items-center px-4 py-3 text-body font-semibold capitalize">
          {monthLabel}
        </p>
        <Link
          href="/insights"
          className="flex items-center gap-2 border-l border-border px-4 py-3 text-body font-semibold transition-colors hover:bg-accent/40"
        >
          {t("Insights", "Análisis")}
          <span aria-hidden className="up-minibar">
            <i style={{ width: "58%", background: "var(--lemon)" }} />
            <i style={{ width: "26%", background: "var(--coral)" }} />
            <i style={{ width: "16%", background: "var(--ink-3)" }} />
          </span>
        </Link>
      </div>

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
          {feedDays.map((day) => (
            <div key={day.date}>
              <p className="up-stripe label-caps px-4 py-1.5">{day.label}</p>
              {day.movements.map((movement) => (
                <TransactionRow
                  key={`${movement.kind}-${movement.id}`}
                  title={movement.title}
                  subtitle={movement.subtitle}
                  amount={movement.amount}
                  currency={movement.currency}
                  kind={movement.kind}
                  category={movement.category}
                  needsReview={movement.needsReview}
                  alt={movement.alt}
                />
              ))}
            </div>
          ))}
          <Link
            href="/movements"
            className="flex items-center justify-center border-t border-border px-4 py-3.5 text-body font-semibold text-primary transition-colors hover:bg-accent/40"
          >
            {t("See all movements", "Ver todos los movimientos")}
          </Link>
        </>
      )}
    </section>
  );
}
