"use client";

import { useState } from "react";
import Link from "next/link";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { InvestmentDashboardSnapshot } from "@/components/investments/investment-dashboard-snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpenText, HeartHandshake } from "lucide-react";

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
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Review the month across spending, envelopes, and steady stewardship cues."
      >
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-[1.75rem]" />
          ))}
        </div>
      ) : (
        <SummaryCards
          totalSpent={summary.totalSpent}
          totalBudget={summary.totalBudget}
          previousMonthTotal={summary.previousMonthTotal}
          topCategory={topCategory}
          assignedCategoryBudgetTotal={summary.assignedCategoryBudgetTotal}
          allocationPercent={summary.allocationPercent}
          hasPlan={summary.allocationPercent !== null}
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
        <div className="space-y-4 lg:col-span-2">
          <CategoryBreakdown
            categoryBreakdown={summary.categoryBreakdown}
          />
          <Card className="border-border/80 bg-card/96">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Sabiduría NBLA
                  </p>
                  <CardTitle className="mt-2 font-heading text-[1.45rem] font-semibold tracking-tight">
                    Financial wisdom for the month
                  </CardTitle>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-emerald-300">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Read short Spanish stewardship themes on generosity, work, debt,
                planning, and the wise administration of goods.
              </p>
              <Link href="/wisdom">
                <Button className="w-full justify-between">
                  Open Sabiduría
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <BookOpenText className="h-4 w-4 text-emerald-300" />
                  This week’s rhythm
                </div>
                <p className="mt-2 leading-6">
                  Protect the pool first, then decide where generosity and
                  diligence need a clearer place in the month.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentExpenses expenses={expenses} />

      <InvestmentDashboardSnapshot />
    </div>
  );
}
