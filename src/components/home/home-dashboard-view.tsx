"use client";

import type {
  HomeAvailableBalance,
  MonthCashflow,
} from "@/lib/home/month-cashflow";
import { cn } from "@/lib/utils";
import {
  HomeActivitySheet,
  type HomeFeedDay,
  type HomeUpcomingPayment,
} from "@/components/home/home-activity-sheet";
import { HomeBalanceCard } from "@/components/home/home-balance-card";
import { HomeMonthPanel } from "@/components/home/home-month-panel";
import {
  ReviewPrompt,
  type HomeReviewPrompt,
} from "@/components/home/review-prompt";
import {
  SpendingBreakdown,
  type HomeSpendingCategory,
} from "@/components/home/spending-breakdown";
import {
  TrackerList,
  TrackerPills,
  type BudgetPaceItem,
} from "@/components/home/tracker-pills";

export interface HomeDashboardViewProps {
  cashflow: MonthCashflow;
  availableBalance: HomeAvailableBalance;
  budgets: BudgetPaceItem[];
  spendingCategories: HomeSpendingCategory[];
  spendingTotal: number;
  feedDays: HomeFeedDay[];
  upcoming: HomeUpcomingPayment[];
  /** Movements waiting for a category; the prompt shows only when count > 0. */
  review?: HomeReviewPrompt;
  showSetupPrompt?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

/**
 * Typed, data-only Home composition shared by the signed-in controller and the
 * design fixture route.
 *
 * Phone is one stack: the balance card, the Trackers as a row of pills, the
 * review prompt when something is waiting, the feed, then the month's category
 * split.
 *
 * Desktop is two rows. The first pairs the balance card with the month panel,
 * so the headline and its context read as one band. The second puts the feed
 * in the wide column and, in a rail beside it, the review prompt, the Trackers
 * and the category split.
 */
export function HomeDashboardView({
  cashflow,
  availableBalance,
  budgets,
  spendingCategories,
  spendingTotal,
  feedDays,
  upcoming,
  review,
  showSetupPrompt = false,
  onSelectCategory,
  className,
}: HomeDashboardViewProps) {
  return (
    <div className={cn("min-w-0 pt-1", className)}>
      <div className="xl:grid xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-stretch xl:gap-6">
        <HomeBalanceCard
          cashflow={cashflow}
          availableBalance={availableBalance}
          flowClassName="xl:hidden"
          className="mx-auto w-full max-w-md xl:mx-0 xl:max-w-none"
        />
        <HomeMonthPanel
          cashflow={cashflow}
          className="hidden xl:mb-[1.125rem] xl:flex"
        />
      </div>

      {/* Full-bleed on a phone so the row scrolls under both screen edges. */}
      <TrackerPills
        budgets={budgets}
        className="-mx-4 mt-5 px-4 sm:-mx-5 sm:px-5 xl:hidden"
      />
      {review && <ReviewPrompt review={review} className="mt-4 xl:hidden" />}

      <div className="mt-6 xl:mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start xl:gap-6">
        <HomeActivitySheet
          feedDays={feedDays}
          upcoming={upcoming}
          showSetupPrompt={showSetupPrompt}
          className="-mx-4 sm:-mx-5 sm:px-1 xl:mx-0 xl:rounded-2xl xl:bg-card xl:px-1 xl:py-5 xl:ring-1 xl:ring-inset xl:ring-border"
        />
        <aside className="mt-7 min-w-0 space-y-6 xl:mt-0">
          {review && (
            <ReviewPrompt review={review} className="hidden xl:flex" />
          )}
          <TrackerList budgets={budgets} className="hidden xl:block" />
          <SpendingBreakdown
            categories={spendingCategories}
            total={spendingTotal}
            onSelect={onSelectCategory}
          />
        </aside>
      </div>
    </div>
  );
}
