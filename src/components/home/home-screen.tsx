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
import {
  resolveHomeAvailableBalance,
  resolveMonthCashflow,
} from "@/lib/home/month-cashflow";
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

  /**
   * Recent movements grouped into Up's feed: a dated separator per day, with
   * stripe parity carried across the whole feed so a separator never consumes
   * a step and resets the rhythm.
   */
  const feedDays = useMemo(() => {
    const days: {
      date: string;
      label: string;
      movements: (typeof recentMovements)[number] & { alt: boolean };
    }[] = [];
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

          {/* Up's Activity shape: one figure on ink, then the feed as the
              screen's primary content. Presupuestos and the donut follow it on
              mobile and sit in the right column on desktop, where there is room
              for both. */}
          <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
            <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-4">
              <div className="order-1 min-w-0 lg:order-none">
                <HomeSummaryCard
                  cashflow={cashflow}
                  availableBalance={availableBalance}
                  monthEndLabel={monthEndLabel}
                />
              </div>

              <section className="up-sheet order-2 -mx-4 min-w-0 sm:-mx-5 lg:order-none lg:mx-0">
                <div className="flex items-stretch border-b border-border">
                  <p className="flex-1 px-4 py-3 text-body font-semibold">
                    {monthEndLabel}
                  </p>
                  <Link
                    href="/insights"
                    className="flex items-center gap-2 border-l border-border px-4 py-3 text-body font-semibold transition-colors hover:bg-accent/40"
                  >
                    {t("Insights", "Análisis")}
                    <span aria-hidden className="up-minibar">
                      <i style={{ width: "58%", background: "var(--lemon)" }} />
                      <i style={{ width: "26%", background: "var(--coral)" }} />
                      <i style={{ width: "16%", background: "var(--ink-3)" }} />
                    </span>
                  </Link>
                </div>

                {feedDays.length === 0 ? (
                  <div className="px-4 py-6">
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
                  <>
                    {feedDays.map((day) => (
                      <div key={day.date}>
                        <p className="up-stripe label-caps px-4 py-1.5">
                          {day.label}
                        </p>
                        {day.movements.map((movement) => (
                          <TransactionRow
                            key={`${movement.kind}-${movement.id}`}
                            title={movement.title}
                            subtitle={movement.subtitle}
                            amount={movement.amount}
                            currency={movement.currency}
                            kind={movement.kind}
                            category={movement.category}
                            needsReview={movement.needsReview}
                            alt={movement.alt}
                          />
                        ))}
                      </div>
                    ))}
                    <Link
                      href="/movements"
                      className="flex items-center justify-center px-4 py-3.5 text-body font-semibold text-primary transition-colors hover:bg-accent/40"
                    >
                      {t("See all movements", "Ver todos los movimientos")}
                    </Link>
                  </>
                )}
              </section>
            </div>

            <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4">
              <section className="order-3 min-w-0 lg:order-none">
                <SectionHeader
                  eyebrow={t("This month", "Este mes")}
                  title={t("Presupuestos", "Presupuestos")}
                  action={
                    budgetsView.length > 0 ? (
                      <Link
                        href="/budget"
                        className="text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t("View all", "Ver todos")}
                      </Link>
                    ) : undefined
                  }
                />
                <div className="mt-3">
                  {budgetsView.length === 0 ? (
                    <div className="flex flex-col items-start gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
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
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-caption font-medium text-primary-foreground transition-colors hover:bg-[var(--coral-deep)]"
                      >
                        {t("Set up budgets", "Configurar presupuestos")}
                      </Link>
                    </div>
                  ) : (
                    <BudgetPaceChart budgets={budgetsView} />
                  )}
                </div>
              </section>

              {donut.slices.length > 0 && (
                <section className="order-4 min-w-0 lg:order-none">
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
                  <div className="mt-3 rounded-xl bg-card p-4 ring-1 ring-border">
                    <BreakdownDonut
                      slices={donut.slices}
                      centerLabel={t("Spent", "Gastado")}
                      centerValue={donut.total}
                      onSelect={openCategory}
                      calloutCount={0}
                    />
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
