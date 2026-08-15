"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getDaysInMonth } from "date-fns";
import {
  useCustomBudgets,
  type CustomBudget,
} from "@/hooks/use-custom-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useMonthlyBudgetPlan } from "@/hooks/use-monthly-budget-plan";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useMonth } from "@/providers/month-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  resolveCustomBudgetAmount,
  calculateCustomBudgetSpending,
  sumConvertedAmounts,
  budgetUsageRatio,
} from "@/lib/budgeting";
import {
  normalizeBudgetKind,
  resolveBudgetKind,
  type BudgetKind,
} from "@/lib/budgeting/envelope-kinds";
import { resolveMonthCashflow } from "@/lib/home/month-cashflow";
import { buildMethodBudgetSeeds } from "@/lib/budgeting/method-seed";
import { MONTHLY_PLAN_FULL_ALLOCATION } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import type { BudgetingMethod } from "@/lib/budgeting-methods";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { BudgetSummaryHero } from "@/components/budget/budget-summary-hero";
import { EnvelopeListCard } from "@/components/budget/envelope-list-card";
import { PlanDistributionCard } from "@/components/budget/plan-distribution-card";
import { BudgetRecommendationCard } from "@/components/budget/budget-recommendation-card";
import { MonthPicker } from "@/components/shared/month-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  CircleDollarSign,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type BudgetView = "trackers" | "savers";

const BudgetWizard = dynamic(() =>
  import("@/components/budgets/budget-wizard").then(
    (module) => module.BudgetWizard
  )
);
const MonthlyPlanForm = dynamic(() =>
  import("@/components/budgets/monthly-plan-form").then(
    (module) => module.MonthlyPlanForm
  )
);
const MethodSelector = dynamic(() =>
  import("@/components/budgets/method-selector").then(
    (module) => module.MethodSelector
  )
);

export function BudgetScreen() {
  const { t } = useLocale();
  const { month, year, isCurrentMonth, setMonthYear } = useMonth();
  const { baseCurrency, convert } = useCurrency();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editBudget, setEditBudget] = useState<CustomBudget | null>(null);
  const [budgetSheetMounted, setBudgetSheetMounted] = useState(false);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [planSheetMounted, setPlanSheetMounted] = useState(false);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [methodSheetMounted, setMethodSheetMounted] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<BudgetingMethod | null>(
    null
  );
  const [activeView, setActiveView] = useState<BudgetView>("trackers");

  const {
    customBudgets,
    loading,
    addCustomBudget,
    updateCustomBudget,
    deleteCustomBudget,
    seedBudgets,
    copyFromPreviousMonth,
  } = useCustomBudgets({ month, year });
  const { categories } = useCategories();
  const { expenses } = useExpenses({ month, year });
  const { summary } = useMonthlySummary({ month, year });
  const {
    plan,
    loading: planLoading,
    upsertPlan,
    deletePlan,
    copyPlanFromPreviousMonth,
  } = useMonthlyBudgetPlan({ month, year });
  const { profile } = useOnboarding();

  const planIncome = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;
  const incomeAmount =
    planIncome !== null && planIncome > 0
      ? planIncome
      : summary.totalIncome > 0
        ? summary.totalIncome
        : null;

  const budgetMetrics = useMemo(
    () =>
      customBudgets.map((budget) => {
        const categoryIds = budget.custom_budget_categories.map(
          (c) => c.category_id
        );
        const resolved = resolveCustomBudgetAmount(
          budget,
          incomeAmount,
          convert
        );
        const spent = calculateCustomBudgetSpending(
          categoryIds,
          expenses,
          convert
        );
        const kind = resolveBudgetKind({
          kind: budget.kind,
          categories: budget.custom_budget_categories.map(
            (link) => link.categories ?? {}
          ),
        });
        const leadCategory =
          budget.custom_budget_categories[0]?.categories ?? null;
        return {
          id: budget.id,
          name: budget.name,
          kind,
          resolved,
          spent,
          ratio: budgetUsageRatio(spent, resolved),
          icon: leadCategory?.icon,
          color: leadCategory?.color,
          categoryName: leadCategory?.name,
        };
      }),
    [customBudgets, incomeAmount, expenses, convert]
  );

  const spendingLimits = useMemo(
    () => budgetMetrics.filter((row) => row.kind === "spending_limit"),
    [budgetMetrics]
  );
  const contributionGoals = useMemo(
    () => budgetMetrics.filter((row) => row.kind === "contribution_goal"),
    [budgetMetrics]
  );

  const cashflow = useMemo(
    () =>
      resolveMonthCashflow({
        monthlyIncome: incomeAmount,
        actualOutflows: summary.totalSpent,
        daysInMonth: getDaysInMonth(new Date(year, month - 1)),
        currentDay: isCurrentMonth
          ? new Date().getDate()
          : getDaysInMonth(new Date(year, month - 1)),
        isCurrentMonth,
      }),
    [incomeAmount, summary.totalSpent, year, month, isCurrentMonth]
  );

  const planSlices = useMemo(() => {
    const colors = ["#EF4444", "#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B", "#06B6D4"];
    return budgetMetrics.map((row, index) => ({
      id: row.id,
      name: row.name,
      amount: row.resolved,
      color: colors[index % colors.length],
    }));
  }, [budgetMetrics]);

  const recommendation = useMemo(() => {
    const over = spendingLimits
      .map((row) => ({
        name: row.name,
        overBy: Math.max(row.spent - row.resolved, 0),
      }))
      .filter((row) => row.overBy > 0)
      .sort((a, b) => b.overBy - a.overBy)[0];
    return over ?? null;
  }, [spendingLimits]);

  const totalBudgeted = budgetMetrics.reduce((s, m) => s + m.resolved, 0);
  /* Only spending inside a budget's categories counts against the plan. */
  const totalConsumed = budgetMetrics.reduce((s, m) => s + m.spent, 0);
  const monthTotalSpent = sumConvertedAmounts(expenses, convert);
  const unallocatedSpent = Math.max(monthTotalSpent - totalConsumed, 0);
  const hasPlan = Boolean(plan);
  const hasBudgets = spendingLimits.length > 0;
  const hasEnvelopes = budgetMetrics.length > 0;
  const needsSetup = !hasPlan && !hasEnvelopes;
  const needsBudgets = hasPlan && !hasBudgets;

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const error = await deleteCustomBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error(
        t("Could not delete budget", "No se pudo eliminar el presupuesto")
      );
      return;
    }
    toast.success(t("Budget removed", "Presupuesto eliminado"));
  }

  async function handleCopy() {
    setCopying(true);
    const planCopied = await copyPlanFromPreviousMonth();
    const count = await copyFromPreviousMonth();
    setCopying(false);
    if (count && count > 0) {
      toast.success(
        planCopied
          ? t(
              `Copied plan and ${count} budget${count !== 1 ? "s" : ""} from last month`,
              `Se copiaron el plan y ${count} presupuesto${count !== 1 ? "s" : ""} del mes anterior`
            )
          : t(
              `Copied ${count} budget${count !== 1 ? "s" : ""} from the previous month`,
              `Se copiaron ${count} presupuesto${count !== 1 ? "s" : ""} del mes anterior`
            )
      );
    } else if (planCopied) {
      toast.success(
        t(
          "Copied last month's income plan",
          "Se copió el plan de ingreso del mes anterior"
        )
      );
    } else {
      toast.info(
        t(
          "No budgets found in the previous month",
          "No se encontraron presupuestos en el mes anterior"
        )
      );
    }
  }

  async function handleSavePlan(values: {
    income_amount: number;
    income_currency: string;
    allocation_percent?: number;
    month: number;
    year: number;
  }) {
    const error = await upsertPlan({
      ...values,
      allocation_percent: MONTHLY_PLAN_FULL_ALLOCATION,
    });
    if (error) {
      toast.error(
        t(
          "Could not save the monthly plan",
          "No se pudo guardar el plan mensual"
        )
      );
      return error;
    }
    toast.success(t("Monthly plan updated", "Plan mensual actualizado"));
    return error;
  }

  async function handleDeletePlan() {
    if (!plan) return;
    setDeletingPlan(true);
    const error = await deletePlan(plan.id);
    setDeletingPlan(false);
    if (error) {
      toast.error(
        t(
          "Could not delete the monthly income",
          "No se pudo eliminar el ingreso mensual"
        )
      );
      return error;
    }
    setConfirmDeletePlan(false);
    setPlanSheetOpen(false);
    toast.success(t("Monthly income removed", "Ingreso mensual eliminado"));
    return null;
  }

  async function handleAddBudget(values: {
    name: string;
    kind?: BudgetKind;
    amount_type: "fixed" | "percentage";
    amount_value: number;
    currency: string;
    category_ids: string[];
    warn_threshold?: number | null;
    repeats_monthly?: boolean;
    month: number;
    year: number;
  }) {
    const error = await addCustomBudget({
      ...values,
      kind: values.kind ?? "spending_limit",
    });
    if (error) {
      toast.error(
        t("Could not save the budget", "No se pudo guardar el presupuesto")
      );
      return error;
    }
    toast.success(t("Budget saved", "Presupuesto guardado"));
    return error;
  }

  async function handleEditBudget(values: {
    name: string;
    kind?: BudgetKind;
    amount_type: "fixed" | "percentage";
    amount_value: number;
    currency: string;
    category_ids: string[];
    warn_threshold?: number | null;
    repeats_monthly?: boolean;
    month: number;
    year: number;
  }) {
    if (!editBudget) return;
    const error = await updateCustomBudget(editBudget.id, {
      ...values,
      kind: values.kind ?? normalizeBudgetKind(editBudget.kind),
    });
    if (error) {
      toast.error(
        t(
          "Could not update the budget",
          "No se pudo actualizar el presupuesto"
        )
      );
      return error;
    }
    setEditBudget(null);
    setBudgetSheetOpen(false);
    toast.success(t("Budget updated", "Presupuesto actualizado"));
    return error;
  }

  function openBudgetSheet(budget: CustomBudget | null = null) {
    setEditBudget(budget);
    setBudgetSheetMounted(true);
    setBudgetSheetOpen(true);
  }

  function openPlanSheet() {
    setPlanSheetMounted(true);
    setPlanSheetOpen(true);
  }

  function openMethodSheet() {
    setMethodSheetMounted(true);
    setMethodSheetOpen(true);
  }

  function handleApplyMethod(method: BudgetingMethod) {
    const seeds = buildMethodBudgetSeeds(method, categories);
    if (seeds.length === 0) {
      toast.error(
        t(
          "This method could not create budgets",
          "Este método no pudo crear presupuestos"
        )
      );
      return;
    }
    if (customBudgets.length > 0) {
      setPendingMethod(method);
      return;
    }
    void applyMethodBudgets(method, false);
  }

  async function applyMethodBudgets(
    method: BudgetingMethod,
    replaceExisting: boolean
  ) {
    const seeds = buildMethodBudgetSeeds(method, categories);
    if (seeds.length === 0) {
      toast.error(
        t(
          "This method could not create budgets",
          "Este método no pudo crear presupuestos"
        )
      );
      return;
    }

    setSeeding(true);
    setMethodSheetOpen(false);

    const { error, count } = await seedBudgets(
      seeds.map((seed) => ({
        name: seed.name,
        kind: seed.kind,
        amount_type: seed.amount_type,
        amount_value: seed.amount_value,
        currency: plan?.income_currency ?? baseCurrency,
        category_ids: seed.category_ids,
      })),
      { replaceExisting }
    );

    setSeeding(false);
    setPendingMethod(null);

    if (error) {
      console.error("seedBudgets failed", error);
      toast.error(
        t(
          "Could not create budgets from this method",
          "No se pudieron crear presupuestos con este método"
        )
      );
      return;
    }

    toast.success(
      plan
        ? t(
            `${method.name}: created ${count} budget${count !== 1 ? "s" : ""}.`,
            `${method.name}: se crearon ${count} presupuesto${count !== 1 ? "s" : ""}.`
          )
        : t(
            `${method.name}: created ${count} budget${count !== 1 ? "s" : ""}. Set your income so percentages resolve to amounts.`,
            `${method.name}: se crearon ${count} presupuesto${count !== 1 ? "s" : ""}. Define tu ingreso para que los % se conviertan en montos.`
          ),
      { duration: 5000 }
    );
  }

  const isLoading = loading || planLoading;

  const buildBudgetsActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        className="w-fit gap-1.5"
        disabled={seeding}
        onClick={openMethodSheet}
      >
        {seeding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <BookOpen className="h-3.5 w-3.5" />
        )}
        {t("Use a method", "Usar un método")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        onClick={() => openBudgetSheet()}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("Build myself", "Crear yo mismo")}
      </Button>
    </div>
  );

  return (
    <Screen
      title={t("Budget", "Presupuesto")}
      mode="dark-canvas"
      width="wide"
      subheader={
        <div className="flex justify-center md:justify-end [&>div]:border-white/12 [&>div]:bg-white/8 [&>div]:text-white [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <MonthPicker
            month={month}
            year={year}
            onChange={setMonthYear}
            onInk
          />
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4 pt-3">
          <Skeleton className="h-40 rounded-xl bg-white/8" />
          <Skeleton className="h-64 rounded-xl bg-white/8" />
          <Skeleton className="h-32 rounded-xl bg-white/8" />
        </div>
      ) : (
        <>
          {needsSetup ? (
            <Card className="mt-3">
              <CardHeader>
                <SectionHeader
                  eyebrow={t("First time here", "Primera vez")}
                  title={t("Two steps to start", "Dos pasos para empezar")}
                  description={
                    profile?.wants_budget_help
                      ? t(
                          "A budget is a spending limit for a group of categories. Set your income, then create budgets — or let a method do it for you.",
                          "Un presupuesto es un límite de gasto para un grupo de categorías. Define tu ingreso y luego crea presupuestos — o deja que un método lo haga."
                        )
                      : t(
                          "A budget is a spending limit for a group of categories.",
                          "Un presupuesto es un límite de gasto para un grupo de categorías."
                        )
                  }
                />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-start gap-3.5 rounded-lg px-2 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-muted-foreground">
                    1
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div>
                      <p className="text-body font-medium">
                        {t("Set your monthly income", "Define tu ingreso mensual")}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {t(
                          "How much comes in this month.",
                          "Cuánto entra este mes."
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-fit gap-1.5"
                      onClick={openPlanSheet}
                    >
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      {t("Set income", "Definir ingreso")}
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 rounded-lg px-2 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-muted-foreground">
                    2
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div>
                      <p className="text-body font-medium">
                        {t("Build your budgets", "Arma tus presupuestos")}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {t(
                          "Use 50/30/20 (or another method) to create them automatically, or build one by one.",
                          "Usa 50/30/20 (u otro método) para crearlos automáticamente, o arma uno a uno."
                        )}
                      </p>
                    </div>
                    {buildBudgetsActions}
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "Tip: set income first so percentage budgets resolve to real amounts.",
                        "Tip: define el ingreso primero para que los presupuestos en % muestren montos reales."
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 pt-3">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/12 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:text-white"
                  disabled={seeding}
                  onClick={openMethodSheet}
                >
                  {seeding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {t("Methods", "Métodos")}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/12 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={handleCopy}
                  disabled={copying}
                >
                  {copying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline">
                    {t("Copy last month", "Copiar mes anterior")}
                  </span>
                </Button>
                <Button size="sm" className="gap-1.5" onClick={openPlanSheet}>
                  {hasPlan ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <CircleDollarSign className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline">
                    {hasPlan
                      ? t("Edit income", "Editar ingreso")
                      : t("Income", "Ingreso")}
                  </span>
                </Button>
                {hasPlan ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/12 bg-white/5 text-white/65 hover:border-danger/40 hover:bg-danger/15 hover:text-danger"
                    onClick={() => setConfirmDeletePlan(true)}
                    disabled={deletingPlan}
                    aria-label={t(
                      "Delete monthly income",
                      "Eliminar ingreso mensual"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openBudgetSheet()}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("New", "Nuevo")}</span>
                </Button>
              </div>

              <BudgetSummaryHero
                cashflow={cashflow}
                dayOfMonth={dayOfMonth}
                daysInMonth={daysInMonth}
              />

              {needsBudgets ? (
                <Card>
                  <CardContent className="space-y-3 py-5">
                    <p className="text-body text-muted-foreground">
                      {t(
                        "Income is set. Create budgets and contribution goals — or let a method do it.",
                        "El ingreso está listo. Crea presupuestos y metas de aportación — o deja que un método lo haga."
                      )}
                    </p>
                    {buildBudgetsActions}
                  </CardContent>
                </Card>
              ) : null}

              <div
                className="relative grid grid-cols-2 border-b border-white/10"
                role="tablist"
                aria-label={t("Budget views", "Vistas de presupuesto")}
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-0.5 w-1/2 bg-coral transition-transform duration-[var(--motion-standard)] motion-reduce:transition-none ${
                    activeView === "savers" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  role="tab"
                  id="budget-trackers-tab"
                  aria-controls="budget-trackers-panel"
                  aria-selected={activeView === "trackers"}
                  onClick={() => setActiveView("trackers")}
                  className={`flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-body font-medium transition-colors duration-[var(--motion-standard)] ${
                    activeView === "trackers"
                      ? "text-white"
                      : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {t("Trackers", "Presupuestos")}
                  <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-label tabular-nums text-white/55">
                    {spendingLimits.length}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  id="budget-savers-tab"
                  aria-controls="budget-savers-panel"
                  aria-selected={activeView === "savers"}
                  onClick={() => setActiveView("savers")}
                  className={`flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-body font-medium transition-colors duration-[var(--motion-standard)] ${
                    activeView === "savers"
                      ? "text-white"
                      : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {t("Savers", "Metas")}
                  <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-label tabular-nums text-white/55">
                    {contributionGoals.length}
                  </span>
                </button>
              </div>

              <section
                key={activeView}
                id={
                  activeView === "trackers"
                    ? "budget-trackers-panel"
                    : "budget-savers-panel"
                }
                role="tabpanel"
                aria-labelledby={
                  activeView === "trackers"
                    ? "budget-trackers-tab"
                    : "budget-savers-tab"
                }
                className="animate-in space-y-3 fade-in-0 slide-in-from-bottom-1 duration-[var(--motion-standard)] motion-reduce:animate-none"
              >
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="label-caps text-white/40">
                      {t("This month", "Este mes")}
                    </p>
                    <h2 className="mt-1 text-title font-semibold text-white">
                      {activeView === "trackers"
                        ? t("Trackers", "Presupuestos")
                        : t("Savers", "Metas")}
                    </h2>
                    <p className="mt-1 max-w-2xl text-caption text-white/50">
                      {activeView === "trackers"
                        ? t(
                            "See what remains in each spending limit. Red appears only after a limit is exceeded.",
                            "Mira cuánto queda en cada límite de gasto. El rojo aparece solo después de excederlo."
                          )
                        : t(
                            "See what you have contributed toward each target. Reaching the target is success.",
                            "Mira cuánto has aportado a cada objetivo. Alcanzar la meta es un logro."
                          )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => openBudgetSheet()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("New", "Nuevo")}
                  </Button>
                </div>

                <EnvelopeListCard
                  kind={
                    activeView === "trackers"
                      ? "spending_limit"
                      : "contribution_goal"
                  }
                  rows={(activeView === "trackers"
                    ? spendingLimits
                    : contributionGoals
                  ).map((row) => ({
                    id: row.id,
                    name: row.name,
                    kind: row.kind,
                    target: row.resolved,
                    progressAmount: row.spent,
                    ratio: row.ratio,
                    icon: row.icon,
                    color: row.color,
                    categoryName: row.categoryName,
                  }))}
                  onEdit={(id) => {
                    const budget = customBudgets.find((b) => b.id === id);
                    if (budget) openBudgetSheet(budget);
                  }}
                  onDelete={(id) => setDeleteId(id)}
                  emptyAction={
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openBudgetSheet()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("Create one", "Crear uno")}
                    </Button>
                  }
                />

                {activeView === "trackers" && unallocatedSpent > 0 ? (
                  <p className="text-caption text-white/45">
                    +{" "}
                    <span className="font-mono tabular-nums text-white/75">
                      {formatCurrency(unallocatedSpent, baseCurrency)}
                    </span>{" "}
                    {t(
                      "spent outside these trackers",
                      "gastado fuera de estos presupuestos"
                    )}
                  </p>
                ) : null}
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <SectionHeader
                      eyebrow={t("This month", "Este mes")}
                      title={t("Plan distribution", "Distribución del plan")}
                      description={t(
                        "Planned budget amounts vs monthly income — not actual spend.",
                        "Montos planificados de presupuestos vs ingreso mensual — no el gasto real."
                      )}
                    />
                  </CardHeader>
                  <CardContent>
                    {planSlices.length === 0 ? (
                      <p className="text-body text-muted-foreground">
                        {t(
                          "Add budgets to see how the plan is allocated.",
                          "Añade presupuestos para ver cómo se reparte el plan."
                        )}
                      </p>
                    ) : (
                      <PlanDistributionCard
                        monthlyIncome={incomeAmount}
                        slices={planSlices}
                      />
                    )}
                    {hasPlan && (
                      <p className="mt-3 text-caption text-muted-foreground">
                        {t(
                          `Income: ${formatCurrency(incomeAmount ?? 0, baseCurrency)}`,
                          `Ingreso: ${formatCurrency(incomeAmount ?? 0, baseCurrency)}`
                        )}
                        {totalBudgeted > 0
                          ? ` · ${t(
                              `Allocated ${formatCurrency(totalBudgeted, baseCurrency)}`,
                              `Asignado ${formatCurrency(totalBudgeted, baseCurrency)}`
                            )}`
                          : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {recommendation ? (
                  <BudgetRecommendationCard
                    name={recommendation.name}
                    overBy={recommendation.overBy}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <SectionHeader
                        eyebrow={t("Guidance", "Guía")}
                        title={t("Recommendation", "Recomendación")}
                      />
                    </CardHeader>
                    <CardContent>
                      <p className="text-body text-muted-foreground">
                        {t(
                          "No budgets are over their limit right now.",
                          "Ningún presupuesto está excedido ahora mismo."
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {budgetSheetMounted ? (
        <BudgetWizard
          key={editBudget?.id ?? "new"}
          mode={editBudget ? "edit" : "create"}
          month={month}
          year={year}
          incomeAmount={incomeAmount}
          incomeCurrency={plan?.income_currency ?? baseCurrency}
          expenses={expenses}
          otherBudgets={customBudgets
            .filter((budget) => budget.id !== editBudget?.id)
            .map((budget) => ({
              id: budget.id,
              name: budget.name,
              categoryIds: budget.custom_budget_categories.map(
                (link) => link.category_id
              ),
            }))}
          onSubmit={editBudget ? handleEditBudget : handleAddBudget}
          open={budgetSheetOpen}
          onOpenChange={(open) => {
            setBudgetSheetOpen(open);
            if (!open) setEditBudget(null);
          }}
          defaultValues={
            editBudget
              ? {
                  name: editBudget.name,
                  kind: normalizeBudgetKind(editBudget.kind),
                  amount_type: editBudget.amount_type as
                    | "fixed"
                    | "percentage",
                  amount_value: editBudget.amount_value,
                  currency: editBudget.currency,
                  category_ids: editBudget.custom_budget_categories.map(
                    (category) => category.category_id
                  ),
                  warn_threshold: editBudget.warn_threshold ?? null,
                  repeats_monthly: editBudget.repeats_monthly ?? true,
                }
              : undefined
          }
        />
      ) : null}

      {planSheetMounted ? (
        <MonthlyPlanForm
          month={month}
          year={year}
          onSubmit={handleSavePlan}
          onDelete={plan ? handleDeletePlan : undefined}
          defaultValues={
            plan
              ? {
                  income_amount: plan.income_amount,
                  income_currency: plan.income_currency,
                }
              : undefined
          }
          controlledOpen={planSheetOpen}
          onOpenChange={setPlanSheetOpen}
        />
      ) : null}

      {methodSheetMounted ? (
        <MethodSelector
          onApply={handleApplyMethod}
          controlledOpen={methodSheetOpen}
          onOpenChange={setMethodSheetOpen}
        />
      ) : null}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>
              {t("Delete budget", "Eliminar presupuesto")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "This only removes the budget and its category assignments. Your expense history will stay intact.",
                "Esto solo elimina el presupuesto y sus categorías asignadas. Tu historial de gastos permanecerá intacto."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingMethod !== null}
        onOpenChange={(open) => {
          if (!open && !seeding) setPendingMethod(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {t("Replace existing budgets?", "¿Reemplazar presupuestos?")}
            </DialogTitle>
            <DialogDescription>
              {pendingMethod
                ? t(
                    `This replaces your ${customBudgets.length} existing budget${customBudgets.length !== 1 ? "s" : ""} with ${pendingMethod.name}.`,
                    `Esto reemplaza tus ${customBudgets.length} presupuesto${customBudgets.length !== 1 ? "s" : ""} con ${pendingMethod.name}.`
                  )
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingMethod(null)}
              disabled={seeding}
            >
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              onClick={() => {
                if (!pendingMethod) return;
                void applyMethodBudgets(pendingMethod, true);
              }}
              disabled={seeding || !pendingMethod}
            >
              {seeding && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Replace budgets", "Reemplazar presupuestos")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeletePlan}
        onOpenChange={(open) => {
          if (!deletingPlan) setConfirmDeletePlan(open);
        }}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>
              {t("Delete monthly income?", "¿Eliminar ingreso mensual?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "This removes this month’s planned income. Your expenses and budgets stay — you can set a new income anytime.",
                "Esto quita el ingreso previsto de este mes. Tus gastos y presupuestos se quedan — puedes definir un ingreso nuevo cuando quieras."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDeletePlan(false)}
              disabled={deletingPlan}
            >
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeletePlan()}
              disabled={deletingPlan}
            >
              {deletingPlan && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}
