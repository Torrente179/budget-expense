"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import type {
  HomeAvailableBalance,
  MonthCashflow,
} from "@/lib/home/month-cashflow";
import { cn } from "@/lib/utils";
import {
  BudgetPaceChart,
  type BudgetPaceItem,
} from "@/components/home/budget-pace-chart";
import {
  HomeActivitySheet,
  type HomeFeedDay,
  type HomeUpcomingPayment,
} from "@/components/home/home-activity-sheet";
import { HomeSummaryCard } from "@/components/home/home-summary-card";
import {
  SpendingBreakdown,
  type HomeSpendingCategory,
} from "@/components/home/spending-breakdown";
import { useLocale } from "@/providers/locale-provider";

export interface HomeDashboardViewProps {
  cashflow: MonthCashflow;
  availableBalance: HomeAvailableBalance;
  monthEndLabel: string;
  monthLabel: string;
  budgets: BudgetPaceItem[];
  spendingCategories: HomeSpendingCategory[];
  spendingTotal: number;
  feedDays: HomeFeedDay[];
  upcoming: HomeUpcomingPayment[];
  showSetupPrompt?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

/**
 * Typed, data-only Home composition shared by the signed-in controller and the
 * design fixture route. Mobile is the canonical stack; desktop preserves that
 * chrome-to-sheet story in the wider left column and moves planning context to
 * a compact right column.
 */
export function HomeDashboardView({
  cashflow,
  availableBalance,
  monthEndLabel,
  monthLabel,
  budgets,
  spendingCategories,
  spendingTotal,
  feedDays,
  upcoming,
  showSetupPrompt = false,
  onSelectCategory,
  className,
}: HomeDashboardViewProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "grid min-w-0 items-start lg:grid-cols-[minmax(0,3fr)_minmax(19rem,2fr)] lg:gap-5",
        className
      )}
    >
      <div className="-mx-4 min-w-0 bg-ink sm:-mx-5 lg:mx-0 lg:overflow-hidden lg:rounded-xl">
        <HomeSummaryCard
          cashflow={cashflow}
          availableBalance={availableBalance}
          monthEndLabel={monthEndLabel}
          className="mx-0 rounded-none sm:mx-0 md:mx-0 md:rounded-none"
        />
        <HomeActivitySheet
          monthLabel={monthLabel}
          feedDays={feedDays}
          upcoming={upcoming}
          showSetupPrompt={showSetupPrompt}
          className="relative -mt-px rounded-b-none"
        />
      </div>

      <aside className="mt-4 min-w-0 space-y-4 lg:mt-0">
        <section className="overflow-hidden rounded-xl bg-ink text-white">
          <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-4">
            <div className="min-w-0">
              <p className="text-label font-medium uppercase tracking-widest text-white/45">
                {t("This month", "Este mes")}
              </p>
              <h2 className="mt-0.5 text-heading font-semibold">
                {t("Trackers", "Presupuestos")}
              </h2>
            </div>
            {budgets.length > 0 ? (
              <Link
                href="/budget"
                className="shrink-0 text-caption font-medium text-white/55 transition-colors hover:text-white"
              >
                {t("View all", "Ver todos")}
              </Link>
            ) : null}
          </div>

          {budgets.length === 0 ? (
            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-coral">
                  <Target className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">
                    {t("No budgets yet", "Aún sin presupuestos")}
                  </p>
                  <p className="mt-0.5 text-caption text-white/50">
                    {t(
                      "Group categories into budgets and we'll track spending against them.",
                      "Agrupa categorías en presupuestos y seguiremos el gasto frente a ellos."
                    )}
                  </p>
                  <Link
                    href="/budget"
                    className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-coral px-4 text-caption font-semibold text-white transition-colors hover:bg-[var(--coral-deep)]"
                  >
                    {t("Set up budgets", "Configurar presupuestos")}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <BudgetPaceChart budgets={budgets} />
            </div>
          )}
        </section>

        <SpendingBreakdown
          categories={spendingCategories}
          total={spendingTotal}
          onSelect={onSelectCategory}
        />
      </aside>
    </div>
  );
}
