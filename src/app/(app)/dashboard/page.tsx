"use client";

import { useState } from "react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });

  const topCategory =
    summary.categoryBreakdown.length > 0
      ? {
          name: summary.categoryBreakdown[0].category_name,
          amount: summary.categoryBreakdown[0].total_amount,
        }
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard">
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </PageHeader>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-lg" />
          ))}
        </div>
      ) : (
        <SummaryCards
          totalSpent={summary.totalSpent}
          totalBudget={summary.totalBudget}
          previousMonthTotal={summary.previousMonthTotal}
          topCategory={topCategory}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SpendingChart
            dailySpending={summary.dailySpending}
            month={month}
            year={year}
          />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdown
            categoryBreakdown={summary.categoryBreakdown}
          />
        </div>
      </div>

      <RecentExpenses expenses={expenses} />
    </div>
  );
}
