"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDaysInMonth } from "date-fns";
import {
  ClipboardCheck,
  Compass,
  FileUp,
  HandHeart,
  LineChart,
  Target,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Wallet,
} from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useCustomBudgets } from "@/hooks/use-custom-budgets";
import { useMonthlyBudgetPlan } from "@/hooks/use-monthly-budget-plan";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePrefetchMonths } from "@/hooks/use-prefetch-months";
import { useTitheTarget } from "@/hooks/use-tithe-target";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import { resolveCustomBudgetAmount } from "@/lib/budgeting";
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
import { AttentionFeed } from "@/components/home/attention-feed";
import { BreakdownDonut } from "@/components/patterns/breakdown-donut";
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

  const { summary, loading } = useMonthlySummary({ month, year });
  const { customBudgets } = useCustomBudgets({ month, year });
  const { plan } = useMonthlyBudgetPlan({ month, year });
  const titheTarget = useTitheTarget();
  const { incomplete, profile } = useOnboarding();
  usePrefetchMonths(month, year, loading, "summary");

  const personalizedCtas = useMemo(() => {
    if (!profile) return [] as ReturnType<typeof buildPersonalization>["homeCtas"];
    return buildPersonalization({
      wantsBudgetHelp: profile.wants_budget_help === true,
      goals: profile.primary_goals,
      hasDebts: profile.primary_goals.includes("pay_debt"),
    }).homeCtas;
  }, [profile]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "Buenos días");
    if (hour < 19) return t("Good afternoon", "Buenas tardes");
    return t("Good evening", "Buenas noches");
  }, [t]);

  /* Current = what's actually left this month. */
  const currentBalance =
    summary.totalIncome - summary.totalSpent - summary.totalInvestmentTransfers;

  /* Month progress, for the budget pace tick. */
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
  const monthProgress = Math.min(dayOfMonth / daysInMonth, 1);

  /* Budget objectives: spend per budget from the category breakdown. */
  const incomeAmount = plan
    ? convert(plan.income_amount, plan.income_currency)
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
          ratio: limit > 0 ? spent / limit : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [customBudgets, summary.categoryBreakdown, incomeAmount, convert]);

  const totalBudgeted = budgetsView.reduce((sum, b) => sum + b.limit, 0);
  /* Only spending inside an objective's categories counts against the plan —
     otherwise this number disagrees with the per-objective rows below it
     (e.g. giving isn't in any objective, so it must not eat the plan). */
  const budgetsSpent = budgetsView.reduce((sum, b) => sum + b.spent, 0);
  const budgetConsumedRatio =
    totalBudgeted > 0 ? budgetsSpent / totalBudgeted : 0;
  const budgetTone =
    budgetConsumedRatio > 1
      ? "bg-danger"
      : budgetConsumedRatio > monthProgress
        ? "bg-warning"
        : "bg-success";

  /* Category donut: top slices + Other, colored by DB category color. */
  const donut = useMemo(() => {
    const rows = summary.categoryBreakdown;
    const total = rows.reduce((sum, row) => sum + row.total_amount, 0);
    const slices: { id: string; name: string; value: number; color: string }[] =
      [];
    if (total <= 0) return { total: 0, slices };
    for (const row of rows.slice(0, 6)) {
      slices.push({
        id: row.category_id,
        name: tc(row.category_name),
        value: row.total_amount,
        color: row.category_color,
      });
    }
    const restSum = rows
      .slice(6)
      .reduce((sum, row) => sum + row.total_amount, 0);
    if (restSum > 0) {
      slices.push({
        id: "other",
        name: t("Other", "Otros"),
        value: restSum,
        color: "var(--chart-3)",
      });
    }
    return { total, slices };
  }, [summary.categoryBreakdown, tc, t]);

  function openCategory(categoryId: string) {
    if (categoryId === "other") return;
    router.push(
      `/insights/categories/${categoryId}?month=${month}&year=${year}&from=dashboard`
    );
  }

  const givingSpent = summary.givingSpent;
  // Generosidad is a share of income (plan first), not of expenses.
  const givingTarget = resolveGivingTarget({
    tithePercent: titheTarget,
    planIncome: incomeAmount,
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

  const goalQuickActions = personalizedCtas
    .map((cta) => {
      switch (cta) {
        case "budget":
          return {
            key: "budget",
            label: t("Budget", "Presupuesto"),
            icon: Wallet,
            href: "/budget",
          };
        case "movements":
          return {
            key: "movements",
            label: t("Movements", "Movimientos"),
            icon: ArrowUpDown,
            href: "/movements",
          };
        case "wealth":
        case "liabilities":
          return {
            key: cta,
            label:
              cta === "liabilities"
                ? t("Debts", "Deudas")
                : t("Wealth", "Patrimonio"),
            icon: TrendingUp,
            href: cta === "liabilities" ? "/wealth/liabilities" : "/wealth",
          };
        case "insights":
          return {
            key: "insights",
            label: t("Insights", "Insights"),
            icon: LineChart,
            href: "/insights",
          };
        default:
          return null;
      }
    })
    .filter((action): action is NonNullable<typeof action> => action !== null);

  /* Adding movements is the FAB's job; these are personalized shortcuts
     plus the two flows without a primary-nav home (import, review). */
  const fallbackQuickActions = [
    {
      key: "import",
      label: t("Import CSV", "Importar CSV"),
      icon: FileUp,
      href: "/import",
    },
    {
      key: "review",
      label: t("Start review", "Iniciar revisión"),
      icon: ClipboardCheck,
      href: "/review",
    },
  ];

  const quickActions = [...goalQuickActions, ...fallbackQuickActions]
    .filter(
      (action, index, list) =>
        list.findIndex((item) => item.key === action.key) === index
    )
    .slice(0, 4);

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

          {/* Month status row: Income · Spent · Current · Giving */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Income", "Ingresos")}
                href="/movements?tab=income"
                value={
                  <span className={cn(SUMMARY_AMOUNT_CLASS, "text-positive")}>
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
                value={
                  <span className={cn(SUMMARY_AMOUNT_CLASS, "text-negative")}>
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
                label={t("Current", "Disponible")}
                value={
                  <span
                    className={cn(
                      SUMMARY_AMOUNT_CLASS,
                      currentBalance >= 0 ? "text-foreground" : "text-negative"
                    )}
                  >
                    {formatCurrencyWithBreaks(currentBalance, baseCurrency)}
                  </span>
                }
                detail={t(
                  "Income − spent − transfers",
                  "Ingresos − gastos − transferencias"
                )}
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

          {/* Budget objectives — the month's plan at a glance */}
          <Card>
            <CardHeader>
              <SectionHeader
                eyebrow={t("Objectives", "Objetivos")}
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
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-medium">
                        {t("No objectives yet", "Aún sin objetivos")}
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
                <>
                  {/* Overall: what's left of the plan, paced against the calendar */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span
                        className={cn(
                          "font-mono text-title tabular-nums",
                          totalBudgeted - budgetsSpent >= 0
                            ? "text-foreground"
                            : "text-negative"
                        )}
                      >
                        {formatCurrency(
                          totalBudgeted - budgetsSpent,
                          baseCurrency
                        )}
                      </span>
                      <span className="min-w-0 text-caption text-muted-foreground sm:text-right">
                        {t(
                          `left of ${formatCurrency(totalBudgeted, baseCurrency)}`,
                          `restante de ${formatCurrency(totalBudgeted, baseCurrency)}`
                        )}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", budgetTone)}
                        style={{
                          width: `${Math.min(budgetConsumedRatio, 1) * 100}%`,
                        }}
                      />
                      {isCurrentMonth && (
                        <div
                          aria-hidden
                          className="absolute inset-y-0 w-0.5 rounded-full bg-foreground/60"
                          style={{ left: `${monthProgress * 100}%` }}
                        />
                      )}
                    </div>
                    {isCurrentMonth && (
                      <p className="text-caption text-muted-foreground">
                        {t(
                          `day ${dayOfMonth} of ${daysInMonth} — the mark shows where the month is`,
                          `día ${dayOfMonth} de ${daysInMonth} — la marca muestra dónde va el mes`
                        )}
                      </p>
                    )}
                  </div>

                  {/* Top objectives */}
                  <div className="space-y-1">
                    {budgetsView.slice(0, 3).map((budget) => (
                      <Link
                        key={budget.id}
                        href="/budget"
                        className="block space-y-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="min-w-0 truncate text-body font-medium">
                            {budget.name}
                          </span>
                          <span className="max-w-full font-mono text-[0.6875rem] leading-tight tabular-nums text-muted-foreground sm:shrink-0 sm:text-right">
                            <span className="text-negative">
                              {formatCurrencyWithBreaks(
                                budget.spent,
                                baseCurrency
                              )}
                            </span>
                            {" / "}
                            {formatCurrencyWithBreaks(
                              budget.limit,
                              baseCurrency
                            )}
                          </span>
                        </div>
                        <ProgressMeter ratio={budget.ratio} className="h-1.5" />
                      </Link>
                    ))}
                    {budgetsView.length > 3 && (
                      <Link
                        href="/budget"
                        className="block px-2 pt-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(
                          `+${budgetsView.length - 3} more`,
                          `+${budgetsView.length - 3} más`
                        )}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Desktop: attention + recents left, donut right. Mobile: donut first. */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="min-w-0 space-y-4 lg:order-2 lg:col-span-2">
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
                      nonInteractiveIds={["other"]}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="min-w-0 space-y-4 lg:order-1 lg:col-span-3">
              <AttentionFeed />

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

              {/* Quick shortcuts — desktop only; mobile has the tab bar + FAB */}
              {quickActions.length > 0 && (
                <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.key}
                      href={action.href}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-3 text-body font-medium transition-colors hover:bg-secondary"
                    >
                      <action.icon className="h-4 w-4 text-muted-foreground" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
