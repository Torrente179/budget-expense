"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Compass,
  FileUp,
  HandHeart,
  LineChart,
  Plus,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Wallet,
} from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePrefetchMonths } from "@/hooks/use-prefetch-months";
import { useTitheTarget } from "@/hooks/use-tithe-target";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import { useMonth } from "@/providers/month-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency } from "@/lib/utils";
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

const HomeSparkline = dynamic(
  () =>
    import("@/components/home/home-sparkline").then((mod) => mod.HomeSparkline),
  { ssr: false }
);

export function HomeScreen() {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const { month, year, setMonthYear } = useMonth();
  const mounted = useChartMounted();

  const { summary, loading } = useMonthlySummary({ month, year });
  const titheTarget = useTitheTarget();
  const { incomplete, profile } = useOnboarding();
  usePrefetchMonths(month, year, loading, "summary");

  const [captureKind, setCaptureKind] = useState<CaptureKind | null>(null);

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

  const givingSpent = summary.givingSpent;
  const givingTarget =
    titheTarget > 0 ? (summary.totalIncome * titheTarget) / 100 : 0;

  const spentDelta =
    summary.previousMonthTotal > 0
      ? (summary.totalSpent - summary.previousMonthTotal) /
        summary.previousMonthTotal
      : null;

  const budgetRatio =
    summary.totalBudget > 0 ? summary.totalSpent / summary.totalBudget : null;

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

  const fallbackQuickActions = [
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

  const quickActions = [
    {
      key: "expense",
      label: t("Add expense", "Añadir gasto"),
      icon: Plus,
      onClick: () => setCaptureKind("expense"),
    },
    ...goalQuickActions,
    ...fallbackQuickActions,
  ]
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
                <HomeSparkline data={sparkData} />
              </div>
            )}
          </Card>

          {/* Month status row */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            <div className="min-w-[11rem] snap-start sm:min-w-0">
              <StatCard
                label={t("Spent", "Gastado")}
                href="/movements?tab=expenses"
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
                href="/movements?tab=income"
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
            {quickActions.map((action) => {
              if ("href" in action && action.href) {
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-3 text-body font-medium transition-colors hover:bg-secondary"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </Link>
                );
              }
              if ("onClick" in action && action.onClick) {
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-3 text-body font-medium transition-colors hover:bg-secondary"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </>
      )}

      {captureKind !== null && (
        <CaptureSheet
          open
          onOpenChange={(open) => {
            if (!open) setCaptureKind(null);
          }}
          kind={captureKind}
        />
      )}
    </Screen>
  );
}
