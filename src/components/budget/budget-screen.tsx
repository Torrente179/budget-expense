"use client";

import { useMemo, useState } from "react";
import { getDaysInMonth } from "date-fns";
import {
  useCustomBudgets,
  type CustomBudget,
} from "@/hooks/use-custom-budgets";
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
} from "@/lib/budgeting";
import { cn, formatCurrency } from "@/lib/utils";
import type { BudgetingMethod } from "@/lib/budgeting-methods";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { MonthPicker } from "@/components/shared/month-picker";
import { CustomBudgetForm } from "@/components/budgets/custom-budget-form";
import { MonthlyPlanForm } from "@/components/budgets/monthly-plan-form";
import { MethodSelector } from "@/components/budgets/method-selector";
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
  Check,
  CircleDollarSign,
  Copy,
  HandHeart,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { isGivingExpense, resolveGivingTarget } from "@/lib/giving";

export function BudgetScreen() {
  const { t } = useLocale();
  const { month, year, isCurrentMonth, setMonthYear } = useMonth();
  const { baseCurrency, convert } = useCurrency();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [appliedMethod, setAppliedMethod] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<CustomBudget | null>(null);

  const {
    customBudgets,
    loading,
    addCustomBudget,
    updateCustomBudget,
    deleteCustomBudget,
    copyFromPreviousMonth,
  } = useCustomBudgets({ month, year });
  const { expenses } = useExpenses({ month, year });
  const { summary } = useMonthlySummary({ month, year });
  const {
    plan,
    loading: planLoading,
    upsertPlan,
  } = useMonthlyBudgetPlan({ month, year });
  const titheTarget = useTitheTarget();
  const { profile } = useOnboarding();

  const incomeAmount = plan
    ? convert(plan.income_amount, plan.income_currency)
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
          ratio: resolved > 0 ? spent / resolved : 0,
        };
      }),
    [customBudgets, incomeAmount, expenses, convert]
  );

  const totalBudgeted = budgetMetrics.reduce((s, m) => s + m.resolved, 0);
  /* Only spending inside an objective's categories counts against the plan —
     otherwise this total disagrees with the per-objective rows below it
     (e.g. giving isn't in any objective, so it must not eat the plan). */
  const totalConsumed = budgetMetrics.reduce((s, m) => s + m.spent, 0);
  const totalRemaining = totalBudgeted - totalConsumed;
  const monthTotalSpent = sumConvertedAmounts(expenses, convert);
  const outsideObjectivesSpent = Math.max(monthTotalSpent - totalConsumed, 0);
  const hasPlan = Boolean(plan);
  const hasBudgets = customBudgets.length > 0;
  const needsSetup = !hasPlan && !hasBudgets;

  /* Month pace for the overview bar. */
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
  const monthProgress = Math.min(dayOfMonth / daysInMonth, 1);
  const consumedRatio = totalBudgeted > 0 ? totalConsumed / totalBudgeted : 0;
  const overviewTone =
    consumedRatio > 1
      ? "bg-danger"
      : consumedRatio > monthProgress
        ? "bg-warning"
        : "bg-success";

  /* Giving pillar — target is % of income (plan first), given is tithe spend. */
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
    planIncome: incomeAmount,
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
    const count = await copyFromPreviousMonth();
    setCopying(false);
    if (count && count > 0) {
      toast.success(
        t(
          `Copied ${count} budget${count !== 1 ? "s" : ""} from the previous month`,
          `Se copiaron ${count} presupuesto${count !== 1 ? "s" : ""} del mes anterior`
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
        t("Could not save the monthly plan", "No se pudo guardar el plan mensual")
      );
      return error;
    }
    toast.success(t("Monthly plan updated", "Plan mensual actualizado"));
    return error;
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
        t("Could not update the budget", "No se pudo actualizar el presupuesto")
      );
      return error;
    }
    setEditBudget(null);
    toast.success(t("Budget updated", "Presupuesto actualizado"));
    return error;
  }

  function handleApplyMethod(method: BudgetingMethod) {
    const totalAllocation = method.slices.reduce((sum, s) => sum + s.percent, 0);
    setAppliedMethod(method.id);
    toast.success(
      t(
        `${method.name} method applied — ${totalAllocation}% allocation. Open the monthly plan to fine-tune income and percentages.`,
        `Método ${method.name} aplicado — ${totalAllocation}% de asignación. Abre el plan mensual para ajustar ingreso y porcentajes.`
      ),
      { duration: 5000 }
    );
  }

  const isLoading = loading || planLoading;

  /* Setup steps for the guided first run. */
  const setupSteps = [
    {
      key: "plan",
      done: hasPlan,
      title: t("Set your monthly income", "Define tu ingreso mensual"),
      caption: t(
        "How much comes in, and what share goes to budgets.",
        "Cuánto entra y qué parte va a presupuestos."
      ),
      action: (
        <MonthlyPlanForm
          month={month}
          year={year}
          onSubmit={handleSavePlan}
          appliedMethodId={appliedMethod}
          onMethodConsumed={() => setAppliedMethod(null)}
          defaultValues={
            plan
              ? {
                  income_amount: plan.income_amount,
                  income_currency: plan.income_currency,
                  allocation_percent: plan.allocation_percent,
                }
              : undefined
          }
          trigger={
            <Button size="sm" className="gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {t("Set plan", "Definir plan")}
            </Button>
          }
        />
      ),
    },
    {
      key: "method",
      done: false,
      optional: true,
      title: t("Pick a method", "Elige un método"),
      caption: t(
        "50/30/20 and others fill in the plan for you.",
        "50/30/20 y otros rellenan el plan por ti."
      ),
      action: (
        <MethodSelector
          onApply={handleApplyMethod}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t("Methods", "Métodos")}
            </Button>
          }
        />
      ),
    },
    {
      key: "objectives",
      done: hasBudgets,
      title: t("Create your objectives", "Crea tus objetivos"),
      caption: t(
        'e.g. "Essentials" with housing and groceries — we warn you before it runs out.',
        'p. ej. "Esenciales" con vivienda y mercado — te avisamos antes de que se agote.'
      ),
      action: (
        <CustomBudgetForm
          month={month}
          year={year}
          incomeAmount={incomeAmount}
          incomeCurrency={plan?.income_currency ?? baseCurrency}
          onSubmit={handleAddBudget}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t("Create", "Crear")}
            </Button>
          }
        />
      ),
    },
  ];

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
            /* First run: teach the model in three steps. */
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("First time here", "Primera vez")}
                  title={t("Three things to get started", "Tres cosas para empezar")}
                  description={
                    profile?.wants_budget_help
                      ? t(
                          "A budget is a monthly spending limit for a group of categories. Set it once; the month is measured against it.",
                          "Un presupuesto es un límite de gasto mensual para un grupo de categorías. Lo defines una vez; el mes se mide contra él."
                        )
                      : t(
                          "A budget is a monthly spending limit for a group of categories.",
                          "Un presupuesto es un límite de gasto mensual para un grupo de categorías."
                        )
                  }
                />
              </CardHeader>
              <CardContent className="space-y-1">
                {setupSteps.map((step, index) => (
                  <div
                    key={step.key}
                    className="flex items-start gap-3.5 rounded-lg px-2 py-3"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                        step.done
                          ? "bg-success-subtle text-success"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {step.done ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div>
                        <p className="text-body font-medium">
                          {step.title}
                          {step.optional && (
                            <span className="ml-2 text-caption font-normal text-muted-foreground">
                              {t("optional", "opcional")}
                            </span>
                          )}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {step.caption}
                        </p>
                      </div>
                      {step.action}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            /* The month at a glance: what's left, paced against the calendar. */
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("This month", "Este mes")}
                  title={t("Your plan", "Tu plan")}
                  action={
                    <div className="flex items-center gap-1.5">
                      <MethodSelector onApply={handleApplyMethod} />
                      <MonthlyPlanForm
                        month={month}
                        year={year}
                        onSubmit={handleSavePlan}
                        appliedMethodId={appliedMethod}
                        onMethodConsumed={() => setAppliedMethod(null)}
                        defaultValues={
                          plan
                            ? {
                                income_amount: plan.income_amount,
                                income_currency: plan.income_currency,
                                allocation_percent: plan.allocation_percent,
                              }
                            : undefined
                        }
                      />
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
                            : "text-negative"
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
                        className={cn("h-full rounded-full", overviewTone)}
                        style={{
                          width: `${Math.min(consumedRatio, 1) * 100}%`,
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
                      {t(
                        `${formatCurrency(totalConsumed, baseCurrency)} spent of ${formatCurrency(totalBudgeted, baseCurrency)} budgeted`,
                        `${formatCurrency(totalConsumed, baseCurrency)} gastado de ${formatCurrency(totalBudgeted, baseCurrency)} presupuestado`
                      )}
                      {isCurrentMonth &&
                        ` · ${t(`day ${dayOfMonth} of ${daysInMonth}`, `día ${dayOfMonth} de ${daysInMonth}`)}`}
                    </p>
                    {outsideObjectivesSpent > 0 && (
                      <p className="text-caption text-muted-foreground">
                        {t(
                          `+ ${formatCurrency(outsideObjectivesSpent, baseCurrency)} spent this month isn't in any objective yet — like Giving below`,
                          `+ ${formatCurrency(outsideObjectivesSpent, baseCurrency)} gastado este mes aún no está en ningún objetivo — como Generosidad abajo`
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-body text-muted-foreground">
                    {t(
                      "Your plan is set — now create your first objective below.",
                      "Tu plan está listo — ahora crea tu primer objetivo abajo."
                    )}
                  </p>
                )}

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

          {/* Objectives */}
          {!needsSetup && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Objectives", "Objetivos")}
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
                        aria-label={t("Copy budgets from last month", "Copiar presupuestos del mes anterior")}
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
                      <CustomBudgetForm
                        month={month}
                        year={year}
                        incomeAmount={incomeAmount}
                        incomeCurrency={plan?.income_currency ?? baseCurrency}
                        onSubmit={handleAddBudget}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">
                              {t("New", "Nuevo")}
                            </span>
                          </Button>
                        }
                      />
                    </div>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-1">
                {customBudgets.length === 0 ? (
                  <div className="py-2">
                    <p className="text-body text-muted-foreground">
                      {t(
                        'Nothing yet. Try "Essentials" for housing and groceries, or copy last month to start.',
                        'Aún nada. Prueba "Esenciales" con vivienda y mercado, o copia el mes anterior para empezar.'
                      )}
                    </p>
                  </div>
                ) : (
                  customBudgets.map((budget) => {
                    const metrics = budgetMetrics.find(
                      (m) => m.id === budget.id
                    );
                    const spent = metrics?.spent ?? 0;
                    const limit = metrics?.resolved ?? 0;
                    const ratio = metrics?.ratio ?? 0;
                    const remaining = limit - spent;
                    return (
                      <div
                        key={budget.id}
                        className="group flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => setEditBudget(budget)}
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
                              {formatCurrency(spent, baseCurrency)} /{" "}
                              {formatCurrency(limit, baseCurrency)}
                            </span>
                          </div>
                          <ProgressMeter ratio={ratio} className="h-1.5" />
                          <p
                            className={cn(
                              "text-caption",
                              remaining >= 0
                                ? "text-muted-foreground"
                                : "text-danger"
                            )}
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
                          aria-label={t("Delete budget", "Eliminar presupuesto")}
                          onClick={() => setDeleteId(budget.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-40 transition-opacity hover:bg-danger-subtle hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                        </button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Giving — the standing first-fruits objective */}
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
                    {givingRatio >= 1
                      ? t(
                          `Target reached — ${formatCurrency(givingSpent, baseCurrency)} given.`,
                          `Meta alcanzada — ${formatCurrency(givingSpent, baseCurrency)} dado.`
                        )
                      : t(
                          `${formatCurrency(givingSpent, baseCurrency)} given · ${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)} left`,
                          `${formatCurrency(givingSpent, baseCurrency)} dado · faltan ${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)}`
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

      {/* Edit budget */}
      <CustomBudgetForm
        key={editBudget?.id ?? "edit"}
        month={month}
        year={year}
        incomeAmount={incomeAmount}
        incomeCurrency={plan?.income_currency ?? baseCurrency}
        onSubmit={handleEditBudget}
        controlledOpen={!!editBudget}
        onOpenChange={(open) => {
          if (!open) setEditBudget(null);
        }}
        defaultValues={
          editBudget
            ? {
                name: editBudget.name,
                amount_type: editBudget.amount_type as "fixed" | "percentage",
                amount_value: editBudget.amount_value,
                currency: editBudget.currency,
                category_ids: editBudget.custom_budget_categories.map(
                  (c) => c.category_id
                ),
              }
            : undefined
        }
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{t("Delete budget", "Eliminar presupuesto")}</DialogTitle>
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
