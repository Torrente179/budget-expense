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
import { useTitheTarget } from "@/hooks/use-tithe-target";
import { useMonth } from "@/providers/month-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  resolveCustomBudgetAmount,
  calculateCustomBudgetSpending,
  sumConvertedAmounts,
  budgetUsageRatio,
} from "@/lib/budgeting";
import { budgetUsageColorForRatio } from "@/lib/palette";
import {
  buildMethodBudgetSeeds,
  methodAllocationPercent,
} from "@/lib/budgeting/method-seed";
import { cn, formatCurrency } from "@/lib/utils";
import type { BudgetingMethod } from "@/lib/budgeting-methods";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { ProgressMeter } from "@/components/patterns/progress-meter";
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
  HandHeart,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { isGivingExpense, resolveGivingTarget } from "@/lib/giving";

const CustomBudgetForm = dynamic(() =>
  import("@/components/budgets/custom-budget-form").then(
    (module) => module.CustomBudgetForm
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
  const [methodSheetMounted, setMethodSheetMounted] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);

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
  const titheTarget = useTitheTarget();
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
        return {
          id: budget.id,
          resolved,
          spent,
          ratio: budgetUsageRatio(spent, resolved),
        };
      }),
    [customBudgets, incomeAmount, expenses, convert]
  );

  const totalBudgeted = budgetMetrics.reduce((s, m) => s + m.resolved, 0);
  /* Only spending inside a budget's categories counts against the plan. */
  const totalConsumed = budgetMetrics.reduce((s, m) => s + m.spent, 0);
  const totalRemaining = totalBudgeted - totalConsumed;
  const monthTotalSpent = sumConvertedAmounts(expenses, convert);
  const unallocatedSpent = Math.max(monthTotalSpent - totalConsumed, 0);
  const hasPlan = Boolean(plan);
  const hasBudgets = customBudgets.length > 0;
  const needsSetup = !hasPlan && !hasBudgets;
  const needsBudgets = hasPlan && !hasBudgets;

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
  const monthProgress = Math.min(dayOfMonth / daysInMonth, 1);
  const consumedRatio = budgetUsageRatio(totalConsumed, totalBudgeted);
  const overviewColor = budgetUsageColorForRatio(consumedRatio);

  const givingSpent = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        return isGivingExpense(expense)
          ? sum + convert(expense.amount, expense.currency)
          : sum;
      }, 0),
    [expenses, convert]
  );
  const givingTarget = resolveGivingTarget({
    tithePercent: titheTarget,
    planIncome: planIncome,
    recordedIncome: summary.totalIncome,
  });
  const givingRatio = givingTarget > 0 ? givingSpent / givingTarget : null;

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
    allocation_percent: number;
    month: number;
    year: number;
  }) {
    const error = await upsertPlan(values);
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
    const error = await deletePlan(plan.id);
    if (error) {
      toast.error(
        t(
          "Could not delete the monthly plan",
          "No se pudo eliminar el plan mensual"
        )
      );
      return error;
    }
    toast.success(t("Monthly plan removed", "Plan mensual eliminado"));
    return null;
  }

  async function handleAddBudget(values: {
    name: string;
    amount_type: "fixed" | "percentage";
    amount_value: number;
    currency: string;
    category_ids: string[];
    month: number;
    year: number;
  }) {
    const error = await addCustomBudget(values);
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
    amount_type: "fixed" | "percentage";
    amount_value: number;
    currency: string;
    category_ids: string[];
    month: number;
    year: number;
  }) {
    if (!editBudget) return;
    const error = await updateCustomBudget(editBudget.id, values);
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

  async function handleApplyMethod(method: BudgetingMethod) {
    const allocation = methodAllocationPercent(method);
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

    let replaceExisting = false;
    if (customBudgets.length > 0) {
      const confirmed = window.confirm(
        t(
          `Replace your ${customBudgets.length} existing budget${customBudgets.length !== 1 ? "s" : ""} with ${method.name}?`,
          `¿Reemplazar tus ${customBudgets.length} presupuesto${customBudgets.length !== 1 ? "s" : ""} con ${method.name}?`
        )
      );
      if (!confirmed) return;
      replaceExisting = true;
    }

    setSeeding(true);

    if (plan) {
      await upsertPlan({
        income_amount: plan.income_amount,
        income_currency: plan.income_currency,
        allocation_percent: Math.min(100, Math.max(1, allocation)),
        month,
        year,
      });
    }

    const { error, count } = await seedBudgets(
      seeds.map((seed) => ({
        name: seed.name,
        amount_type: seed.amount_type,
        amount_value: seed.amount_value,
        currency: plan?.income_currency ?? baseCurrency,
        category_ids: seed.category_ids,
      })),
      { replaceExisting }
    );

    setSeeding(false);

    if (error) {
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
            `${method.name}: created ${count} budget${count !== 1 ? "s" : ""}. Generosidad stays on its own card.`,
            `${method.name}: se crearon ${count} presupuesto${count !== 1 ? "s" : ""}. Generosidad sigue en su propia tarjeta.`
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
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <>
          {needsSetup ? (
            <Card>
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
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("This month", "Este mes")}
                  title={t("Your plan", "Tu plan")}
                  action={
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
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
                        <span className="hidden sm:inline">
                          {t("Methods", "Métodos")}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={openPlanSheet}
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        <span className="hidden md:inline">
                          {t("Set monthly plan", "Definir plan mensual")}
                        </span>
                      </Button>
                    </div>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {hasBudgets ? (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "font-mono text-display tabular-nums",
                          totalRemaining >= 0
                            ? "text-foreground"
                            : "text-expense"
                        )}
                      >
                        {formatCurrency(totalRemaining, baseCurrency)}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {totalRemaining >= 0
                          ? t("left to spend", "restante para gastar")
                          : t("over budget", "sobre el presupuesto")}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.min(
                            Number.isFinite(consumedRatio) ? consumedRatio : 1,
                            1
                          ) * 100}%`,
                          backgroundColor: overviewColor,
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
                    <p className="text-caption text-muted-foreground">
                      <span className="font-mono tabular-nums text-expense">
                        {formatCurrency(totalConsumed, baseCurrency)}
                      </span>{" "}
                      {t("spent of", "gastado de")}{" "}
                      <span className="font-mono tabular-nums">
                        {formatCurrency(totalBudgeted, baseCurrency)}
                      </span>{" "}
                      {t("budgeted", "presupuestado")}
                      {isCurrentMonth &&
                        ` · ${t(`day ${dayOfMonth} of ${daysInMonth}`, `día ${dayOfMonth} de ${daysInMonth}`)}`}
                    </p>
                  </div>
                ) : needsBudgets ? (
                  <div className="space-y-3">
                    <p className="text-body text-muted-foreground">
                      {t(
                        "Income is set. Create budgets with a method, or build them yourself.",
                        "El ingreso está listo. Crea presupuestos con un método, o ármalos tú."
                      )}
                    </p>
                    {buildBudgetsActions}
                  </div>
                ) : null}

                {hasPlan && (
                  <p className="text-caption text-muted-foreground">
                    {t(
                      `Plan: ${formatCurrency(incomeAmount ?? 0, baseCurrency)} income · ${plan?.allocation_percent}% allocated to budgets`,
                      `Plan: ${formatCurrency(incomeAmount ?? 0, baseCurrency)} de ingreso · ${plan?.allocation_percent}% asignado a presupuestos`
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {!needsSetup && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Budgets", "Presupuestos")}
                  title={t("Your budgets", "Tus presupuestos")}
                  description={t(
                    "Each one groups categories and warns you before it runs out.",
                    "Cada uno agrupa categorías y te avisa antes de agotarse."
                  )}
                  action={
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleCopy}
                        disabled={copying}
                        aria-label={t(
                          "Copy budgets from last month",
                          "Copiar presupuestos del mes anterior"
                        )}
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
                      <Button
                        size="sm"
                        className="w-fit gap-1.5"
                        onClick={() => openBudgetSheet()}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {t("New budget", "Nuevo presupuesto")}
                        </span>
                        <span className="sm:hidden">{t("New", "Nuevo")}</span>
                      </Button>
                    </div>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-1">
                {customBudgets.length === 0 ? (
                  <div className="space-y-3 py-2">
                    <p className="text-body text-muted-foreground">
                      {t(
                        'Nothing yet. Use a method like 50/30/20, or create "Essentials" for housing and groceries.',
                        'Aún nada. Usa un método como 50/30/20, o crea "Esenciales" con vivienda y mercado.'
                      )}
                    </p>
                    {buildBudgetsActions}
                  </div>
                ) : (
                  <>
                    {customBudgets.map((budget) => {
                      const metrics = budgetMetrics.find(
                        (m) => m.id === budget.id
                      );
                      const spent = metrics?.spent ?? 0;
                      const limit = metrics?.resolved ?? 0;
                      const ratio = metrics?.ratio ?? 0;
                      const remaining = limit - spent;
                      const usageColor = budgetUsageColorForRatio(ratio);
                      return (
                        <div
                          key={budget.id}
                          className="group flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => openBudgetSheet(budget)}
                            className="min-w-0 flex-1 space-y-1.5 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent/50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate text-body font-medium">
                                {budget.name}
                                <span className="ml-2 text-caption font-normal text-muted-foreground">
                                  {t(
                                    `${budget.custom_budget_categories.length} ${budget.custom_budget_categories.length === 1 ? "category" : "categories"}`,
                                    `${budget.custom_budget_categories.length} ${budget.custom_budget_categories.length === 1 ? "categoría" : "categorías"}`
                                  )}
                                </span>
                              </span>
                              <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                                <span className="text-expense">
                                  {formatCurrency(spent, baseCurrency)}
                                </span>
                                {" / "}
                                {formatCurrency(limit, baseCurrency)}
                              </span>
                            </div>
                            <ProgressMeter ratio={ratio} className="h-1.5" />
                            <p
                              className={cn(
                                "text-caption",
                                remaining >= 0 && "text-muted-foreground"
                              )}
                              style={
                                remaining < 0
                                  ? { color: usageColor }
                                  : undefined
                              }
                            >
                              {remaining >= 0
                                ? t(
                                    `${formatCurrency(remaining, baseCurrency)} left`,
                                    `${formatCurrency(remaining, baseCurrency)} restante`
                                  )
                                : t(
                                    `${formatCurrency(Math.abs(remaining), baseCurrency)} over`,
                                    `${formatCurrency(Math.abs(remaining), baseCurrency)} excedido`
                                  )}
                            </p>
                          </button>
                          <button
                            type="button"
                            aria-label={t(
                              "Delete budget",
                              "Eliminar presupuesto"
                            )}
                            onClick={() => setDeleteId(budget.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {unallocatedSpent > 0 && (
                      <p className="px-2 pt-2 text-caption text-muted-foreground">
                        +{" "}
                        <span className="font-mono tabular-nums text-expense">
                          {formatCurrency(unallocatedSpent, baseCurrency)}
                        </span>{" "}
                        {t(
                          "spent outside these budgets (includes Generosidad below)",
                          "gastado fuera de estos presupuestos (incluye Generosidad abajo)"
                        )}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <SectionHeader
                eyebrow={t("First fruits", "Primicias")}
                title={t("Giving", "Generosidad")}
                action={
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-subtle text-success">
                    <HandHeart className="h-4.5 w-4.5" />
                  </div>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-title font-semibold tabular-nums">
                  {givingTarget > 0
                    ? formatCurrency(givingTarget, baseCurrency)
                    : "—"}
                </p>
                <p className="text-caption text-muted-foreground">
                  {t(
                    `${titheTarget}% of income`,
                    `${titheTarget}% del ingreso`
                  )}
                </p>
              </div>
              {givingRatio !== null ? (
                <>
                  <ProgressMeter
                    ratio={givingRatio}
                    tone={givingRatio >= 1 ? "success" : "neutral"}
                  />
                  <p className="text-caption text-muted-foreground">
                    {givingRatio >= 1 ? (
                      <>
                        {t("Target reached —", "Meta alcanzada —")}{" "}
                        <span className="font-mono tabular-nums text-negative">
                          {formatCurrency(givingSpent, baseCurrency)}
                        </span>{" "}
                        {t("given.", "dado.")}
                      </>
                    ) : (
                      <>
                        <span className="font-mono tabular-nums text-negative">
                          {formatCurrency(givingSpent, baseCurrency)}
                        </span>{" "}
                        {t("given ·", "dado ·")}{" "}
                        {t(
                          `${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)} left`,
                          `faltan ${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)}`
                        )}
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Set monthly income in your plan — Generosidad is a share of income, not of expenses.",
                    "Define el ingreso en tu plan — Generosidad es un porcentaje del ingreso, no de los gastos."
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {budgetSheetMounted ? (
        <CustomBudgetForm
          key={editBudget?.id ?? "new"}
          month={month}
          year={year}
          incomeAmount={incomeAmount}
          incomeCurrency={plan?.income_currency ?? baseCurrency}
          onSubmit={editBudget ? handleEditBudget : handleAddBudget}
          controlledOpen={budgetSheetOpen}
          onOpenChange={(open) => {
            setBudgetSheetOpen(open);
            if (!open) setEditBudget(null);
          }}
          defaultValues={
            editBudget
              ? {
                  name: editBudget.name,
                  amount_type: editBudget.amount_type as
                    | "fixed"
                    | "percentage",
                  amount_value: editBudget.amount_value,
                  currency: editBudget.currency,
                  category_ids: editBudget.custom_budget_categories.map(
                    (category) => category.category_id
                  ),
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
                  allocation_percent: plan.allocation_percent,
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
    </Screen>
  );
}
