"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon, CategoryOption, CATEGORY_SELECT_CONTENT_CLASS } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { useReviewQueue } from "@/hooks/use-review-queue";
import { detectAnomalies } from "@/lib/insights/anomalies";
import { formatCurrency, getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

type Step = "uncategorized" | "anomalies" | "upcoming" | "summary";

const STEP_ORDER: Step[] = ["uncategorized", "anomalies", "upcoming", "summary"];

/**
 * The 2-minute weekly review: (1) one-tap categorize flagged movements,
 * (2) glance at spending anomalies, (3) preview the next 7 days of
 * recurring charges — ending on the stewardship summary. Read-mostly by
 * design: the only mutation is categorization.
 */
export function ReviewFlow() {
  const { t, tc } = useLocale();
  const { baseCurrency } = useCurrency();
  const [step, setStep] = useState<Step>("uncategorized");

  const { expenses, count, loading, categorize } = useReviewQueue();
  const { categories } = useCategories();
  const { insights } = useHouseholdInsights();
  const { recurringExpenses } = useRecurringExpenses();
  const month = getCurrentMonth();
  const year = getCurrentYear();
  const { summary } = useMonthlySummary({ month, year });

  const currentMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const anomalies = useMemo(
    () =>
      insights
        ? detectAnomalies(insights.categoryMonthTotals, currentMonthKey)
        : [],
    [insights, currentMonthKey]
  );

  const upcoming = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    return recurringExpenses
      .filter((expense) => expense.is_active)
      .map((expense) => {
        // Days until the next charge_day, within a 7-day horizon
        const daysInMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).getDate();
        const chargeDay = Math.min(expense.charge_day, daysInMonth);
        const daysAway =
          chargeDay >= todayDay
            ? chargeDay - todayDay
            : daysInMonth - todayDay + expense.charge_day;
        return { expense, daysAway };
      })
      .filter(({ daysAway }) => daysAway <= 7)
      .sort((a, b) => a.daysAway - b.daysAway);
  }, [recurringExpenses]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const next = () =>
    setStep(STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]);

  const stepMeta: Record<Step, { label: string; count?: number }> = {
    uncategorized: {
      label: t("Categorize", "Categorizar"),
      count: loading ? undefined : count,
    },
    anomalies: { label: t("Anomalies", "Anomalías"), count: anomalies.length },
    upcoming: { label: t("Upcoming", "Próximos"), count: upcoming.length },
    summary: { label: t("Summary", "Resumen") },
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex flex-wrap gap-2">
        {STEP_ORDER.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setStep(item)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              step === item
                ? "bg-secondary text-foreground ring-1 ring-border"
                : index < stepIndex
                  ? "text-muted-foreground"
                  : "text-muted-foreground/60"
            }`}
          >
            {index < stepIndex && <Check className="h-3 w-3 text-success" />}
            {stepMeta[item].label}
            {stepMeta[item].count !== undefined && stepMeta[item].count! > 0 && (
              <Badge variant="secondary">{stepMeta[item].count}</Badge>
            )}
          </button>
        ))}
      </div>

      {step === "uncategorized" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Needs a category", "Necesita categoría")}</CardTitle>
            <CardDescription>
              {t(
                "Movements the importer wasn't sure about. One tap each; 'remember' teaches it for next time.",
                "Movimientos que el importador no supo clasificar. Un toque cada uno; 'recordar' le enseña para la próxima."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={t("All caught up", "Todo al día")}
                description={t(
                  "Nothing is waiting for a category.",
                  "Nada espera una categoría."
                )}
              />
            ) : (
              <ul className="space-y-2">
                {expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-border"
                  >
                    <CategoryIcon
                      icon={expense.categories?.icon ?? "circle"}
                      color={expense.categories?.color ?? "var(--muted-foreground)"}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {expense.description ?? expense.categories?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.date}
                      </p>
                    </div>
                    <CurrencyDisplay
                      amount={-expense.amount}
                      currency={expense.currency}
                      tone="negative"
                    />
                    <div className="w-44">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (!value) return;
                          void categorize.mutateAsync({
                            expenseId: expense.id,
                            categoryId: value,
                            remember: expense.description
                              ? { pattern: expense.description }
                              : undefined,
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 border-border/80 bg-secondary/40 text-xs">
                          <SelectValue
                            placeholder={t("Set category", "Asignar categoría")}
                          />
                        </SelectTrigger>
                        <SelectContent className={CATEGORY_SELECT_CONTENT_CLASS}>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                              className="text-sm"
                            >
                              <CategoryOption
                                name={tc(category.name)}
                                icon={category.icon}
                                color={category.color}
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {step === "anomalies" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Out of pattern", "Fuera de patrón")}</CardTitle>
            <CardDescription>
              {t(
                "Categories running well above their usual month. Just so you know — nothing to fix here.",
                "Categorías muy por encima de su mes habitual. Solo para que lo sepas — nada que corregir aquí."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title={t("Nothing unusual", "Nada inusual")}
                description={t(
                  "Every category is within its normal range this month.",
                  "Todas las categorías están en su rango normal este mes."
                )}
              />
            ) : (
              <ul className="space-y-2">
                {anomalies.map((anomaly) => (
                  <li
                    key={anomaly.categoryId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-border"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {anomaly.categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          `usually ~${formatCurrency(anomaly.historicalMean, baseCurrency)}/month (${anomaly.monthsOfHistory} months)`,
                          `normalmente ~${formatCurrency(anomaly.historicalMean, baseCurrency)}/mes (${anomaly.monthsOfHistory} meses)`
                        )}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-negative">
                      {formatCurrency(anomaly.currentTotal, baseCurrency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {step === "upcoming" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Next 7 days", "Próximos 7 días")}</CardTitle>
            <CardDescription>
              {t(
                "Recurring charges about to land, so nothing surprises you.",
                "Cargos recurrentes a punto de llegar, para que nada te sorprenda."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={t("A quiet week", "Semana tranquila")}
                description={t(
                  "No recurring charges in the next 7 days.",
                  "Sin cargos recurrentes en los próximos 7 días."
                )}
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map(({ expense, daysAway }) => (
                  <li
                    key={expense.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-border"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {expense.description ??
                          t("Recurring charge", "Cargo recurrente")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysAway === 0
                          ? t("today", "hoy")
                          : t(`in ${daysAway} days`, `en ${daysAway} días`)}
                      </p>
                    </div>
                    <CurrencyDisplay
                      amount={-expense.amount}
                      currency={expense.currency}
                      tone="negative"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {step === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("That's the week", "Eso es la semana")}</CardTitle>
            <CardDescription>
              {t(
                "Three numbers. Then go live your week.",
                "Tres números. Luego ve y vive tu semana."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryLine
              label={t("Giving rate (12M)", "Tasa de dar (12M)")}
              value={
                insights?.givingRate != null
                  ? `${(insights.givingRate * 100).toFixed(1)}%`
                  : "—"
              }
              detail={
                insights
                  ? t(
                      `target ${insights.titheTargetPercent}%`,
                      `meta ${insights.titheTargetPercent}%`
                    )
                  : ""
              }
              good={
                insights?.givingRate != null &&
                insights.givingRate * 100 >= (insights?.titheTargetPercent ?? 10)
              }
            />
            <SummaryLine
              label={t("Savings rate (12M)", "Tasa de ahorro (12M)")}
              value={
                insights?.savingsRate != null
                  ? `${(insights.savingsRate * 100).toFixed(1)}%`
                  : "—"
              }
              good={(insights?.savingsRate ?? 0) > 0}
            />
            <SummaryLine
              label={t("Net flow this month", "Flujo neto este mes")}
              value={formatCurrency(summary.monthlyNetFlow, baseCurrency)}
              good={summary.monthlyNetFlow >= 0}
            />
            <div className="pt-2">
              <Link
                href="/home"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-secondary/60 px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t("Back to dashboard", "Volver al panel")}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {step !== "summary" && (
        <div className="flex justify-end">
          <Button onClick={next}>
            {t("Next", "Siguiente")}
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryLine({
  label,
  value,
  detail,
  good,
}: {
  label: string;
  value: string;
  detail?: string;
  good: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <p className="flex-1 text-sm text-muted-foreground">{label}</p>
      <p
        className={`font-heading text-xl tracking-tight ${
          good ? "text-success" : ""
        }`}
      >
        {value}
      </p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
