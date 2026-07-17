"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  FileUp,
  HandHeart,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { usePrefetchMonths } from "@/hooks/use-prefetch-months";
import { useTitheTarget } from "@/hooks/use-tithe-target";
import { useMonth } from "@/providers/month-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency, getMonthName } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { StatCard } from "@/components/patterns/stat-card";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { AttentionFeed } from "@/components/home/attention-feed";
import { MonthPicker } from "@/components/shared/month-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { CaptureSheet, type CaptureKind } from "@/components/capture/capture-sheet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartMounted } from "@/components/charts/chart-theme";
import { ArrowUpDown } from "lucide-react";

const GIVING_KEYWORDS = [
  "tithe",
  "diezmo",
  "giving",
  "donation",
  "donación",
  "donacion",
  "charity",
  "caridad",
  "offering",
  "ofrenda",
  "church",
  "iglesia",
  "generosity",
  "generosidad",
];

function isGivingName(name: string) {
  const lower = name.toLowerCase();
  return GIVING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function HomeScreen() {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const { month, year, setMonthYear } = useMonth();
  const mounted = useChartMounted();

  const { summary, loading } = useMonthlySummary({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { incomes } = useIncomes({ month, year });
  const titheTarget = useTitheTarget();
  usePrefetchMonths(month, year, loading);

  const [captureKind, setCaptureKind] = useState<CaptureKind | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "Buenos días");
    if (hour < 19) return t("Good afternoon", "Buenas tardes");
    return t("Good evening", "Buenas noches");
  }, [t]);

  // Safe-to-spend: stricter of cash available and remaining budget.
  const cashAvailable =
    summary.totalIncome - summary.totalSpent - summary.totalInvestmentTransfers;
  const budgetRemaining =
    summary.totalBudget > 0 ? summary.totalBudget - summary.totalSpent : null;
  const safeToSpend =
    budgetRemaining !== null
      ? Math.min(cashAvailable, budgetRemaining)
      : cashAvailable;
  const boundByBudget =
    budgetRemaining !== null && budgetRemaining < cashAvailable;

  const sparkData = useMemo(() => {
    const sorted = [...summary.dailySpending].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    let cumulative = 0;
    return sorted.map((day) => {
      cumulative += day.amount;
      return { date: day.date, total: cumulative };
    });
  }, [summary.dailySpending]);

  const givingSpent = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        const category = expense.categories;
        const giving =
          category?.classification === "giving" ||
          isGivingName(category?.name ?? "") ||
          (expense.description ? isGivingName(expense.description) : false);
        return giving ? sum + convert(expense.amount, expense.currency) : sum;
      }, 0),
    [expenses, convert]
  );
  const givingTarget =
    titheTarget > 0 ? (summary.totalIncome * titheTarget) / 100 : 0;

  const spentDelta =
    summary.previousMonthTotal > 0
      ? (summary.totalSpent - summary.previousMonthTotal) /
        summary.previousMonthTotal
      : null;

  const budgetRatio =
    summary.totalBudget > 0 ? summary.totalSpent / summary.totalBudget : null;

  const recentMovements = useMemo(() => {
    const expenseItems = expenses.map((expense) => ({
      id: expense.id,
      kind: "expense" as const,
      title: expense.description || tc(expense.categories?.name ?? "—"),
      subtitle: tc(expense.categories?.name ?? "—"),
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      category: expense.categories
        ? { icon: expense.categories.icon, color: expense.categories.color }
        : null,
      needsReview: expense.needs_review,
    }));
    const incomeItems = incomes.map((income) => ({
      id: income.id,
      kind: "income" as const,
      title: income.source,
      subtitle: income.description || t("Income", "Ingreso"),
      amount: income.amount,
      currency: income.currency,
      date: income.date,
      category: null,
      needsReview: false,
    }));
    return [...expenseItems, ...incomeItems]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [expenses, incomes, t, tc]);

  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1));

  const quickActions = [
    {
      key: "expense",
      label: t("Add expense", "Añadir gasto"),
      icon: Plus,
      onClick: () => setCaptureKind("expense"),
    },
    {
      key: "income",
      label: t("Add income", "Añadir ingreso"),
      icon: TrendingUp,
      onClick: () => setCaptureKind("income"),
    },
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

  return (
    <Screen
      eyebrow={monthLabel}
      title={greeting}
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Safe-to-spend hero — the one number, plus the month's pace. */}
          <Card className="relative overflow-hidden">
            <CardContent className="relative z-10 space-y-1.5 py-6">
              <p className="label-caps">
                {t("Safe to spend", "Disponible para gastar")}
              </p>
              <p
                className={cn(
                  "font-mono text-display tabular-nums",
                  safeToSpend >= 0 ? "text-foreground" : "text-negative"
                )}
              >
                {formatCurrency(safeToSpend, baseCurrency)}
              </p>
              <p className="text-caption text-muted-foreground">
                {boundByBudget
                  ? t(
                      `Budget cap: ${formatCurrency(budgetRemaining ?? 0, baseCurrency)} left of ${formatCurrency(summary.totalBudget, baseCurrency)} plan`,
                      `Límite del plan: quedan ${formatCurrency(budgetRemaining ?? 0, baseCurrency)} de ${formatCurrency(summary.totalBudget, baseCurrency)}`
                    )
                  : t(
                      "Income − spent − transfers this month",
                      "Ingresos − gastos − transferencias del mes"
                    )}
              </p>
            </CardContent>
            {mounted && sparkData.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sparkData}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="homeSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--chart-1)"
                      strokeWidth={1.5}
                      fill="url(#homeSpark)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Month status row */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Spent", "Gastado")}
                value={
                  <span className="font-mono text-heading font-semibold tabular-nums">
                    {formatCurrency(summary.totalSpent, baseCurrency)}
                  </span>
                }
                detail={
                  spentDelta !== null ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        spentDelta > 0 ? "text-negative" : "text-positive"
                      )}
                    >
                      {spentDelta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {`${Math.abs(spentDelta * 100).toFixed(0)}% ${t("vs last month", "vs mes anterior")}`}
                    </span>
                  ) : (
                    t("No previous month", "Sin mes anterior")
                  )
                }
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Income", "Ingresos")}
                value={
                  <span className="font-mono text-heading font-semibold tabular-nums text-positive">
                    {formatCurrency(summary.totalIncome, baseCurrency)}
                  </span>
                }
                detail={t(
                  `${summary.expenseCount} movements`,
                  `${summary.expenseCount} movimientos`
                )}
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Giving", "Generosidad")}
                icon={<HandHeart className="h-4 w-4" />}
                value={
                  <span className="font-mono text-heading font-semibold tabular-nums">
                    {formatCurrency(givingSpent, baseCurrency)}
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
                        {t(
                          `${Math.round((givingSpent / givingTarget) * 100)}% of ${titheTarget}% target`,
                          `${Math.round((givingSpent / givingTarget) * 100)}% de la meta del ${titheTarget}%`
                        )}
                      </span>
                    </div>
                  ) : (
                    t("No target set", "Sin meta definida")
                  )
                }
                href="/budget"
              />
            </div>
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Budget used", "Plan usado")}
                value={
                  <span className="font-mono text-heading font-semibold tabular-nums">
                    {budgetRatio !== null
                      ? `${Math.round(budgetRatio * 100)}%`
                      : "—"}
                  </span>
                }
                detail={
                  budgetRatio !== null ? (
                    <ProgressMeter ratio={budgetRatio} className="h-1" />
                  ) : (
                    t("No plan this month", "Sin plan este mes")
                  )
                }
                href="/budget"
              />
            </div>
          </div>

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

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) =>
              "href" in action && action.href ? (
                <Link
                  key={action.key}
                  href={action.href}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-3 text-body font-medium transition-colors hover:bg-secondary"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-3 text-body font-medium transition-colors hover:bg-secondary"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.label}
                </button>
              )
            )}
          </div>
        </>
      )}

      <CaptureSheet
        open={captureKind !== null}
        onOpenChange={(open) => {
          if (!open) setCaptureKind(null);
        }}
        kind={captureKind ?? "expense"}
      />
    </Screen>
  );
}
