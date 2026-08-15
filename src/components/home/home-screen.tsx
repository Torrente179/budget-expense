"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth } from "date-fns";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
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
import { MonthPicker } from "@/components/shared/month-picker";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeScreen() {
  const { t, tc, intlLocale } = useLocale();
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "Buenos días");
    if (hour < 19) return t("Good afternoon", "Buenas tardes");
    return t("Good evening", "Buenas noches");
  }, [t]);

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

  const monthEndLabel = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, daysInMonth));
  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

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

  return (
    <Screen
      title={greeting}
      actions={
        <MonthPicker
          month={month}
          year={year}
          onChange={setMonthYear}
          onInk
        />
      }
      mode="chrome-sheet"
      width="wide"
    >
      {loading ? (
        <div className="grid min-w-0 items-start lg:grid-cols-[minmax(0,3fr)_minmax(19rem,2fr)] lg:gap-5">
          <div className="-mx-4 sm:-mx-5 lg:mx-0">
            <Skeleton className="h-72 rounded-none bg-ink/90 lg:rounded-t-xl" />
            <Skeleton className="h-80 rounded-none bg-card lg:rounded-b-xl" />
          </div>
          <div className="mt-4 space-y-4 lg:mt-0">
            <Skeleton className="h-48 rounded-xl bg-ink/90" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : (
        <HomeDashboardView
          cashflow={cashflow}
          availableBalance={availableBalance}
          monthEndLabel={monthEndLabel}
          monthLabel={monthLabel}
          budgets={budgetsView}
          spendingCategories={spendingBreakdown.categories}
          spendingTotal={spendingBreakdown.total}
          feedDays={feedDays}
          upcoming={upcomingPayments}
          showSetupPrompt={incomplete}
          onSelectCategory={openCategory}
        />
      )}
    </Screen>
  );
}
