"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDaysInMonth } from "date-fns";
import {
  Compass,
  HandHeart,
  Target,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useTitheTarget } from "@/hooks/use-tithe-target";
import {
  resolveCustomBudgetAmount,
  budgetUsageRatio,
} from "@/lib/budgeting";
import { resolveGivingTarget } from "@/lib/giving";
import { useMonth } from "@/providers/month-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency, formatCurrencyWithBreaks } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { StatCard } from "@/components/patterns/stat-card";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { BudgetPaceChart } from "@/components/home/budget-pace-chart";
import { BreakdownDonut, type DonutSlice } from "@/components/patterns/breakdown-donut";
import { MonthPicker } from "@/components/shared/month-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SUMMARY_AMOUNT_CLASS =
  "block max-w-full whitespace-normal font-mono text-[clamp(0.6875rem,5.5cqw,1.0625rem)] font-semibold leading-tight tracking-[-0.025em] tabular-nums";

export function HomeScreen() {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
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
  const titheTarget = useTitheTarget();
  const { incomplete } = useOnboarding();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "Buenos días");
    if (hour < 19) return t("Good afternoon", "Buenas tardes");
    return t("Good evening", "Buenas noches");
  }, [t]);

  /* Available is an actual checkpoint-based balance, never monthly net flow. */
  const currentBalance = summary.trackedBalance;
  const balanceAsOfLabel = summary.balanceAsOfDate
    ? new Intl.DateTimeFormat(intlLocale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${summary.balanceAsOfDate}T00:00:00Z`))
    : null;
  const monthlyNetLabel = formatCurrency(
    summary.monthlyNetFlow,
    baseCurrency,
    intlLocale
  );
  const availableDetail =
    summary.balanceTrackingStatus === "tracked" && balanceAsOfLabel
      ? t(
          `As of ${balanceAsOfLabel} · Month net ${monthlyNetLabel}`,
          `Al ${balanceAsOfLabel} · Flujo del mes ${monthlyNetLabel}`
        )
      : summary.balanceTrackingStatus === "future"
        ? t(
            `Not projected · Month net ${monthlyNetLabel}`,
            `Sin proyección · Flujo del mes ${monthlyNetLabel}`
          )
        : summary.balanceTrackingStatus === "unavailable"
          ? t(
              `Temporarily unavailable · Month net ${monthlyNetLabel}`,
              `No disponible · Flujo del mes ${monthlyNetLabel}`
            )
          : t(
              `${isCurrentMonth ? "Set starting balance" : "Not reconciled"} · Month net ${monthlyNetLabel}`,
              `${isCurrentMonth ? "Define el saldo inicial" : "Sin conciliación"} · Flujo del mes ${monthlyNetLabel}`
            );

  /* Month progress, for the budget pace tick. */
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
  const monthProgress = Math.min(dayOfMonth / daysInMonth, 1);

  /* Budget limits: spend per budget from the category breakdown.
     Percentage budgets fall back to recorded income when the plan is missing. */
  const planIncome = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;
  const incomeAmount =
    planIncome !== null && planIncome > 0
      ? planIncome
      : summary.totalIncome > 0
        ? summary.totalIncome
        : null;

  const budgetsView = useMemo(() => {
    if (customBudgets.length === 0) return [];
    const spentByCategory = new Map(
      summary.categoryBreakdown.map((row) => [row.category_id, row.total_amount])
    );
    return customBudgets
      .map((budget) => {
        const limit = resolveCustomBudgetAmount(budget, incomeAmount, convert);
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
  }, [customBudgets, summary.categoryBreakdown, incomeAmount, convert]);

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

  const givingSpent = summary.givingSpent;
  // Generosidad is a share of income (plan first), not of expenses.
  const givingTarget = resolveGivingTarget({
    tithePercent: titheTarget,
    planIncome: planIncome,
    recordedIncome: summary.totalIncome,
  });

  const spentDelta =
    summary.previousMonthTotal > 0
      ? (summary.totalSpent - summary.previousMonthTotal) /
        summary.previousMonthTotal
      : null;

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

  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1));

  return (
    <Screen
      eyebrow={monthLabel}
      title={greeting}
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-44 rounded-xl" />
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

          {/* Month status row: Income · Spent · Available · Giving */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Income", "Ingresos")}
                href="/movements?tab=income"
                swatchClassName="bg-income"
                value={
                  <span className={cn(SUMMARY_AMOUNT_CLASS, "text-income")}>
                    {formatCurrencyWithBreaks(
                      summary.totalIncome,
                      baseCurrency
                    )}
                  </span>
                }
                detail={t("this month", "este mes")}
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Spent", "Gastado")}
                href="/movements?tab=expenses"
                swatchClassName="bg-expense"
                value={
                  <span className={cn(SUMMARY_AMOUNT_CLASS, "text-expense")}>
                    {formatCurrencyWithBreaks(
                      summary.totalSpent,
                      baseCurrency
                    )}
                  </span>
                }
                detail={
                  spentDelta !== null ? (
                    <span className="inline-flex items-center gap-1">
                      {spentDelta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {`${Math.abs(spentDelta * 100).toFixed(0)}% ${t("vs last month", "vs mes anterior")}`}
                    </span>
                  ) : (
                    t(
                      `${summary.expenseCount} movements`,
                      `${summary.expenseCount} movimientos`
                    )
                  )
                }
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Available", "Disponible")}
                href="/settings#available-balance"
                swatchClassName={
                  currentBalance !== null && currentBalance < 0
                    ? "bg-expense"
                    : "bg-available"
                }
                value={
                  <span
                    className={cn(
                      SUMMARY_AMOUNT_CLASS,
                      currentBalance !== null && currentBalance < 0
                        ? "text-expense"
                        : "text-available"
                    )}
                  >
                    {currentBalance === null
                      ? "—"
                      : formatCurrencyWithBreaks(
                          currentBalance,
                          baseCurrency,
                          intlLocale
                        )}
                  </span>
                }
                detail={availableDetail}
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Giving", "Generosidad")}
                icon={<HandHeart className="h-4 w-4" />}
                value={
                  <span className={SUMMARY_AMOUNT_CLASS}>
                    {givingTarget > 0
                      ? formatCurrencyWithBreaks(givingTarget, baseCurrency)
                      : "—"}
                  </span>
                }
                detail={
                  givingTarget > 0 ? (
                    <div className="space-y-1">
                      <ProgressMeter
                        ratio={givingSpent / givingTarget}
                        tone={givingSpent >= givingTarget ? "success" : "neutral"}
                        className="h-1"
                      />
                      <span>
                        <span className="font-mono tabular-nums text-negative">
                          {formatCurrency(givingSpent, baseCurrency)}
                        </span>{" "}
                        {t(
                          `given · ${titheTarget}% of income`,
                          `dado · ${titheTarget}% del ingreso`
                        )}
                      </span>
                    </div>
                  ) : (
                    t(
                      "Based on your monthly income",
                      "Basado en tu ingreso mensual"
                    )
                  )
                }
                href="/budget"
              />
            </div>
          </div>

          {/* Desktop: movements left; budgets + donut stacked right (same width).
              Mobile: budgets → donut → movements. */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="min-w-0 space-y-4 lg:order-2 lg:col-span-2">
              {/* Monthly budgets — pace at a glance */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("Budgets", "Presupuestos")}
                    title={t("Monthly budgets", "Presupuestos del mes")}
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
                      monthProgress={monthProgress}
                      isCurrentMonth={isCurrentMonth}
                    />
                  )}
                </CardContent>
              </Card>

              {donut.slices.length > 0 && (
                <Card>
                  <CardHeader>
                    <SectionHeader
                      eyebrow={t("This month", "Este mes")}
                      title={t("Where it went", "A dónde se fue")}
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
                      calloutCount={5}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="min-w-0 space-y-4 lg:order-1 lg:col-span-3">
              {/* Recent movements */}
              <Card>
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
          </div>
        </>
      )}
    </Screen>
  );
}
