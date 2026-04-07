"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { getBiblicalWisdomContent } from "@/lib/biblical-wisdom";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { GivingInsights } from "@/components/dashboard/giving-insights";
import { MonthlyReport } from "@/components/dashboard/monthly-report";
import { MobileDashboardOverview } from "@/components/dashboard/mobile-dashboard-overview";
import { InvestmentDashboardSnapshot } from "@/components/investments/investment-dashboard-snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpenText, HeartHandshake } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

export default function DashboardPage() {
  const { locale, t } = useLocale();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const wisdomContent = getBiblicalWisdomContent(locale);
  const wisdomSourcesLabel = wisdomContent.translations
    .map((translation) => translation.code)
    .join(" / ");

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { budgets } = useBudgets({ month, year });

  /* Map expenses for the giving component */
  const givingExpenses = useMemo(
    () =>
      expenses.map((exp) => ({
        id: exp.id,
        amount: exp.amount,
        currency: exp.currency,
        description: exp.description,
        categoryName: (exp as any).categories?.name ?? "Other",
        categoryIcon: (exp as any).categories?.icon ?? "more-horizontal",
        categoryColor: (exp as any).categories?.color ?? "#64748b",
        category_id: exp.category_id,
      })),
    [expenses]
  );

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
        title={t("Dashboard", "Panel")}
        description={t(
          "Review the month across spending, envelopes, and steady stewardship cues.",
          "Revisa el mes con una vista clara de gastos, sobres y señales de mayordomía."
        )}
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
        <div className="space-y-4">
          <div className="space-y-4 md:hidden">
            <Skeleton className="h-[338px] rounded-[1.75rem]" />
            <Skeleton className="h-[246px] rounded-[1.75rem]" />
          </div>
          <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[150px] rounded-[1.75rem]" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <MobileDashboardOverview
            totalIncome={summary.totalIncome}
            totalSpent={summary.totalSpent}
            availableBalance={summary.availableBalance}
            totalBudget={summary.totalBudget}
            previousMonthTotal={summary.previousMonthTotal}
            expenseCount={summary.expenseCount}
            topCategory={topCategory}
            dailySpending={summary.dailySpending}
            month={month}
            year={year}
          />
          <div className="hidden md:block">
            <SummaryCards
              totalIncome={summary.totalIncome}
              totalSpent={summary.totalSpent}
              availableBalance={summary.availableBalance}
              previousMonthTotal={summary.previousMonthTotal}
              allocationPercent={summary.allocationPercent}
              hasPlan={summary.allocationPercent !== null}
            />
          </div>
        </>
      )}

      <div className="hidden gap-4 md:grid lg:grid-cols-5">
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
                    {wisdomSourcesLabel}
                  </p>
                  <CardTitle className="mt-2 font-heading text-[1.45rem] font-semibold tracking-tight">
                    {t(
                      "Bible wisdom for the month",
                      "Sabiduría bíblica para el mes"
                    )}
                  </CardTitle>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-emerald-300">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {t(
                  "Read short stewardship themes on generosity, work, debt, planning, and the wise administration of goods.",
                  "Lee temas breves de mayordomía sobre generosidad, trabajo, deuda, planeación y administración sabia."
                )}
              </p>
              <Link href="/wisdom">
                <Button className="w-full justify-between">
                  {t("Open Wisdom", "Abrir Sabiduría")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <BookOpenText className="h-4 w-4 text-emerald-300" />
                  {t("This week's rhythm", "Ritmo de esta semana")}
                </div>
                <p className="mt-2 leading-6">
                  {t(
                    "Protect the pool first, then decide where generosity and diligence need a clearer place in the month.",
                    "Protege primero el fondo mensual y luego decide dónde la generosidad y la diligencia necesitan más claridad."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentExpenses expenses={expenses} maxItems={4} />

      {/* Giving insights & monthly report */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GivingInsights
          expenses={givingExpenses}
          totalIncome={summary.totalIncome}
        />
        <MonthlyReport
          totalSpent={summary.totalSpent}
          totalIncome={summary.totalIncome}
          totalBudget={summary.totalBudget}
          previousMonthTotal={summary.previousMonthTotal}
          expenseCount={summary.expenseCount}
          categoryBreakdown={summary.categoryBreakdown}
          budgets={budgets}
        />
      </div>

      <InvestmentDashboardSnapshot />
    </div>
  );
}
