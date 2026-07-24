"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDaysInMonth } from "date-fns";
import { Compass, Target, ArrowUpDown } from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  resolveCustomBudgetAmount,
  budgetUsageRatio,
} from "@/lib/budgeting";
import { resolveBudgetKind } from "@/lib/budgeting/envelope-kinds";
import { resolveMonthCashflow } from "@/lib/home/month-cashflow";
import { useMonth } from "@/providers/month-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { BudgetPaceChart } from "@/components/home/budget-pace-chart";
import { HomeSummaryCard } from "@/components/home/home-summary-card";
import { BreakdownDonut, type DonutSlice } from "@/components/patterns/breakdown-donut";
import { MonthPicker } from "@/components/shared/month-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  const monthEndLabel = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, daysInMonth));

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
        const spent = budget.custom_budget_categories.reduce(
          (sum, link) => sum + (spentByCategory.get(link.category_id) ?? 0),
          0
        );
        return {
          id: budget.id,
          name: budget.name,
          limit,
          spent,
          ratio: budgetUsageRatio(spent, limit),
        };
      })
      .sort((a, b) => {
        const ar = Number.isFinite(a.ratio) ? a.ratio : Number.MAX_VALUE;
        const br = Number.isFinite(b.ratio) ? b.ratio : Number.MAX_VALUE;
        return br - ar;
      });
  }, [customBudgets, summary.categoryBreakdown, monthlyIncome, convert]);

  /* Category donut: every spent category, colored by DB category color. */
  const donut = useMemo(() => {
    const rows = summary.categoryBreakdown;
    const total = rows.reduce((sum, row) => sum + row.total_amount, 0);
    if (total <= 0) return { total: 0, slices: [] as DonutSlice[] };
    const slices: DonutSlice[] = rows.map((row) => ({
      id: row.category_id,
      name: tc(row.category_name),
      value: row.total_amount,
      color: row.category_color,
    }));
    return { total, slices };
  }, [summary.categoryBreakdown, tc]);

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

  return (
    <Screen
      title={greeting}
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {incomplete && (
            <Card className="border-border/60 bg-secondary/40">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body font-medium">
                      {t("Finish your setup", "Termina tu configuración")}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "Income, recurring costs, debts, and goals — skip anytime.",
                        "Ingresos, gastos fijos, deudas y metas — puedes saltarlo."
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href="/onboarding"
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-caption font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("Continue setup", "Continuar")}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Desktop: [Hero + Movimientos] | [Presupuestos + Gastos]
              Mobile: Hero → Presupuestos → Gastos → Movimientos */}
          <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
            <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-4">
              <div className="order-1 min-w-0 lg:order-none">
                <HomeSummaryCard
                  cashflow={cashflow}
                  monthEndLabel={monthEndLabel}
                />
              </div>

              <Card className="order-4 min-w-0 lg:order-none">
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("Latest", "Recientes")}
                    title={t("Recent movements", "Movimientos recientes")}
                    action={
                      <Link
                        href="/movements"
                        className="text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t("View all", "Ver todos")}
                      </Link>
                    }
                  />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {recentMovements.length === 0 ? (
                    <div className="px-4 pb-4">
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
                    <div className="divide-y divide-border/40">
                      {recentMovements.map((movement) => (
                        <TransactionRow
                          key={`${movement.kind}-${movement.id}`}
                          title={movement.title}
                          subtitle={`${movement.subtitle} · ${new Intl.DateTimeFormat(
                            intlLocale,
                            { day: "numeric", month: "short" }
                          ).format(new Date(`${movement.date}T00:00:00`))}`}
                          amount={movement.amount}
                          currency={movement.currency}
                          kind={movement.kind}
                          category={movement.category}
                          needsReview={movement.needsReview}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4">
              <Card className="order-2 min-w-0 lg:order-none">
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("This month", "Este mes")}
                    title={t("Budgets", "Presupuestos")}
                    action={
                      budgetsView.length > 0 ? (
                        <Link
                          href="/budget"
                          className="text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t("Manage", "Gestionar")}
                        </Link>
                      ) : undefined
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {budgetsView.length === 0 ? (
                    <div className="flex flex-col items-start gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body font-medium">
                            {t("No budgets yet", "Aún sin presupuestos")}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {t(
                              "Group categories into budgets and we'll track spending against them.",
                              "Agrupa categorías en presupuestos y seguiremos el gasto frente a ellos."
                            )}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/budget"
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-3.5 text-caption font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t("Set up budgets", "Configurar presupuestos")}
                      </Link>
                    </div>
                  ) : (
                    <BudgetPaceChart
                      budgets={budgetsView}
                      monthProgress={cashflow.monthProgress}
                      isCurrentMonth={isCurrentMonth}
                    />
                  )}
                </CardContent>
              </Card>

              {donut.slices.length > 0 && (
                <Card className="order-3 min-w-0 lg:order-none">
                  <CardHeader>
                    <SectionHeader
                      eyebrow={t("This month", "Este mes")}
                      title={t(
                        "Your spending by category",
                        "Tus gastos por categoría"
                      )}
                      action={
                        <Link
                          href="/insights"
                          className="text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t("Insights", "Análisis")}
                        </Link>
                      }
                    />
                  </CardHeader>
                  <CardContent>
                    <BreakdownDonut
                      slices={donut.slices}
                      centerLabel={t("Spent", "Gastado")}
                      centerValue={donut.total}
                      amountTone="negative"
                      onSelect={openCategory}
                      calloutCount={0}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
