"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth } from "date-fns";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useReviewCount } from "@/hooks/use-review-queue";
import {
  resolveCustomBudgetAmount,
  budgetUsageRatio,
} from "@/lib/budgeting";
import { resolveBudgetKind } from "@/lib/budgeting/envelope-kinds";
import {
  resolveHomeAvailableBalance,
  resolveMonthCashflow,
} from "@/lib/home/month-cashflow";
import { useMonth } from "@/providers/month-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { Screen } from "@/components/patterns/screen";
import { HomeDashboardView } from "@/components/home/home-dashboard-view";
import { MonthTitle } from "@/components/shared/month-title";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeScreen() {
  const { t, tc, intlLocale } = useLocale();
  const reviewCount = useReviewCount();
  const { convert } = useCurrency();
  const { month, year, isCurrentMonth, setMonthYear } = useMonth();
  const router = useRouter();

  const { summary, snapshot, loading } = useMonthlySummary({ month, year });
  const customBudgets = useMemo(
    () => snapshot?.customBudgets ?? [],
    [snapshot]
  );
  const plan = snapshot?.monthlyPlan
    ? {
        income_amount: snapshot.monthlyPlan.incomeAmount,
        income_currency: snapshot.monthlyPlan.incomeCurrency,
      }
    : null;
  const { incomplete } = useOnboarding();

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;

  /* Plan income when set, else recorded income. */
  const planIncome = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;
  const monthlyIncome =
    planIncome !== null && planIncome > 0
      ? planIncome
      : summary.totalIncome > 0
        ? summary.totalIncome
        : null;

  const cashflow = useMemo(
    () =>
      resolveMonthCashflow({
        monthlyIncome,
        actualOutflows: summary.totalSpent,
        daysInMonth,
        currentDay: dayOfMonth,
        isCurrentMonth,
      }),
    [monthlyIncome, summary.totalSpent, daysInMonth, dayOfMonth, isCurrentMonth]
  );

  const availableBalance = useMemo(
    () =>
      resolveHomeAvailableBalance({
        trackedBalance:
          summary.balanceTrackingStatus === "tracked"
            ? summary.trackedBalance
            : null,
        monthlyRemaining: cashflow.remaining,
        daysRemaining: cashflow.daysRemaining,
      }),
    [
      cashflow.daysRemaining,
      cashflow.remaining,
      summary.balanceTrackingStatus,
      summary.trackedBalance,
    ]
  );

  const budgetsView = useMemo(() => {
    if (customBudgets.length === 0) return [];
    const spentByCategory = new Map(
      summary.categoryBreakdown.map((row) => [row.category_id, row.total_amount])
    );
    return customBudgets
      .filter(
        (budget) =>
          resolveBudgetKind({
            kind: budget.kind,
            categories: budget.custom_budget_categories.map(
              (link) => link.categories ?? {}
            ),
          }) === "spending_limit"
      )
      .map((budget) => {
        const limit = resolveCustomBudgetAmount(budget, monthlyIncome, convert);
        const links = budget.custom_budget_categories.map((link) => ({
          link,
          spent: spentByCategory.get(link.category_id) ?? 0,
        }));
        const spent = links.reduce((sum, row) => sum + row.spent, 0);
        /* Card glyph: the category carrying most of this budget's spend. */
        const leading = links.reduce<(typeof links)[number] | undefined>(
          (best, row) => (!best || row.spent > best.spent ? row : best),
          undefined
        );
        return {
          id: budget.id,
          name: budget.name,
          limit,
          spent,
          ratio: budgetUsageRatio(spent, limit),
          icon: leading?.link.categories?.icon,
          color: leading?.link.categories?.color,
        };
      })
      .sort((a, b) => {
        const ar = Number.isFinite(a.ratio) ? a.ratio : Number.MAX_VALUE;
        const br = Number.isFinite(b.ratio) ? b.ratio : Number.MAX_VALUE;
        return br - ar;
      });
  }, [customBudgets, summary.categoryBreakdown, monthlyIncome, convert]);

  /* Ranked category composition: the same converted totals the donut used. */
  const spendingBreakdown = useMemo(() => {
    const rows = summary.categoryBreakdown;
    const total = rows.reduce((sum, row) => sum + row.total_amount, 0);
    const categories = rows.map((row) => ({
      id: row.category_id,
      name: tc(row.category_name),
      value: row.total_amount,
      color: row.category_color,
      expenseCount: row.expense_count,
    }));
    return { total, categories };
  }, [summary.categoryBreakdown, tc]);

  const upcomingPayments = useMemo(() => {
    const anchorDay = isCurrentMonth ? dayOfMonth : 1;
    const distanceFromAnchor = (chargeDay: number) =>
      chargeDay >= anchorDay
        ? chargeDay - anchorDay
        : daysInMonth - anchorDay + chargeDay;

    return [...(snapshot?.recurringExpenses ?? [])]
      .filter((recurring) => recurring.is_active)
      .sort(
        (a, b) =>
          distanceFromAnchor(a.charge_day) -
          distanceFromAnchor(b.charge_day)
      )
      .map((recurring) => ({
        id: recurring.id,
        title:
          recurring.description || tc(recurring.categories?.name ?? "—"),
        dueLabel: t(
          `day ${recurring.charge_day}`,
          `día ${recurring.charge_day}`
        ),
        amount: recurring.amount,
        currency: recurring.currency,
        category: recurring.categories
          ? {
              icon: recurring.categories.icon,
              color: recurring.categories.color,
            }
          : null,
      }));
  }, [dayOfMonth, daysInMonth, isCurrentMonth, snapshot, t, tc]);

  function openCategory(categoryId: string) {
    router.push(
      `/insights/categories/${categoryId}?month=${month}&year=${year}&from=dashboard`
    );
  }

  const recentMovements = useMemo(
    () =>
      summary.recentMovements.map((movement) => ({
        ...movement,
        title:
          movement.kind === "expense"
            ? movement.title === "—"
              ? "—"
              : tc(movement.title)
            : movement.title,
        subtitle:
          movement.kind === "income"
            ? movement.subtitle === "Income"
              ? t("Income", "Ingreso")
              : movement.subtitle
            : tc(movement.subtitle),
      })),
    [summary.recentMovements, t, tc]
  );

  /**
   * Recent movements grouped into Up's feed: a dated separator per day, with
   * stripe parity carried across the whole feed so a separator never consumes
   * a step and resets the rhythm.
   */
  const feedDays = useMemo(() => {
    const byDate = new Map<string, typeof recentMovements>();
    for (const movement of recentMovements) {
      const bucket = byDate.get(movement.date);
      if (bucket) bucket.push(movement);
      else byDate.set(movement.date, [movement]);
    }
    const fmt = new Intl.DateTimeFormat(intlLocale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    let parity = 0;
    return Array.from(byDate, ([date, movements]) => ({
      date,
      label: fmt.format(new Date(`${date}T00:00:00`)),
      movements: movements.map((movement) => ({
        ...movement,
        alt: parity++ % 2 === 1,
      })),
    }));
  }, [recentMovements, intlLocale]);

  // Name one waiting movement in the prompt when the feed already holds it.
  const review = useMemo(() => {
    const waiting = recentMovements.find((movement) => movement.needsReview);
    return {
      count: reviewCount,
      preview: waiting
        ? {
            title: waiting.title,
            amount: waiting.amount,
            currency: waiting.currency,
          }
        : undefined,
    };
  }, [recentMovements, reviewCount]);

  return (
    <Screen
      title={
        <MonthTitle month={month} year={year} onChange={setMonthYear} />
      }
      mode="chrome-sheet"
      width="wide"
    >
      {loading ? (
        <div className="min-w-0 pt-1">
          <div className="xl:grid xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-6">
            <Skeleton className="mx-auto h-[13.875rem] w-full max-w-md rounded-2xl bg-card xl:mx-0 xl:max-w-none" />
            <Skeleton className="hidden h-[12.75rem] rounded-2xl bg-card xl:block" />
          </div>
          <div className="mt-5 flex gap-2 xl:hidden">
            <Skeleton className="h-11 w-44 rounded-full bg-card" />
            <Skeleton className="h-11 w-44 rounded-full bg-card" />
          </div>
          <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:gap-6">
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-2xl bg-card" />
              <Skeleton className="h-14 rounded-2xl bg-card" />
              <Skeleton className="h-14 rounded-2xl bg-card" />
            </div>
            <Skeleton className="mt-7 h-64 rounded-2xl bg-card xl:mt-0" />
          </div>
        </div>
      ) : (
        <HomeDashboardView
          cashflow={cashflow}
          availableBalance={availableBalance}
          budgets={budgetsView}
          spendingCategories={spendingBreakdown.categories}
          spendingTotal={spendingBreakdown.total}
          feedDays={feedDays}
          upcoming={upcomingPayments}
          review={review}
          showSetupPrompt={incomplete}
          onSelectCategory={openCategory}
        />
      )}
    </Screen>
  );
}
