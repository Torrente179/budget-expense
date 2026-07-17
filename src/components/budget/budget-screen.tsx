"use client";

import { useMemo, useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import type { BudgetingMethod } from "@/lib/budgeting-methods";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { MonthPicker } from "@/components/shared/month-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomBudgetForm } from "@/components/budgets/custom-budget-form";
import { CustomBudgetCard } from "@/components/budgets/custom-budget-card";
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
import { Copy, HandHeart, Loader2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

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

export function BudgetScreen() {
  const { t } = useLocale();
  const { month, year, setMonthYear } = useMonth();
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
        return { id: budget.id, resolved, spent };
      }),
    [customBudgets, incomeAmount, expenses, convert]
  );

  const totalBudgeted = budgetMetrics.reduce((s, m) => s + m.resolved, 0);
  const totalConsumed = sumConvertedAmounts(expenses, convert);
  const totalRemaining = totalBudgeted - totalConsumed;
  const hasPlan = Boolean(plan);

  // Giving pillar
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

  return (
    <Screen
      title={t("Budget", "Presupuesto")}
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Giving pillar — first, on purpose. */}
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
                  {formatCurrency(givingSpent, baseCurrency)}
                </p>
                {givingTarget > 0 && (
                  <p className="text-caption text-muted-foreground">
                    {t(
                      `of ${formatCurrency(givingTarget, baseCurrency)} target (${titheTarget}%)`,
                      `de la meta de ${formatCurrency(givingTarget, baseCurrency)} (${titheTarget}%)`
                    )}
                  </p>
                )}
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
                          "Target reached — well done.",
                          "Meta alcanzada — bien hecho."
                        )
                      : t(
                          `${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)} to reach this month's target`,
                          `${formatCurrency(Math.max(givingTarget - givingSpent, 0), baseCurrency)} para alcanzar la meta del mes`
                        )}
                  </p>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Set your giving target in Settings → Stewardship.",
                    "Define tu meta de generosidad en Ajustes → Mayordomía."
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Income pool plan */}
          <Card>
            <CardHeader>
              <SectionHeader
                eyebrow={t("Monthly plan", "Plan mensual")}
                title={
                  hasPlan
                    ? t("Income pool", "Fondo de ingresos")
                    : t("No plan yet", "Aún sin plan")
                }
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
              {hasPlan ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="label-caps">{t("Income", "Ingreso")}</p>
                    <p className="mt-1 font-mono text-body font-semibold tabular-nums">
                      {formatCurrency(incomeAmount ?? 0, baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps">{t("Allocated", "Asignado")}</p>
                    <p className="mt-1 font-mono text-body font-semibold tabular-nums">
                      {plan?.allocation_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="label-caps">{t("Pool", "Fondo")}</p>
                    <p className="mt-1 font-mono text-body font-semibold tabular-nums">
                      {formatCurrency(
                        ((incomeAmount ?? 0) * (plan?.allocation_percent ?? 0)) /
                          100,
                        baseCurrency
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-body text-muted-foreground">
                  {t(
                    "Create a monthly plan to unlock percentage-based budgets that adjust automatically to your income.",
                    "Crea un plan mensual para desbloquear presupuestos por porcentaje que se ajustan automáticamente a tu ingreso."
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Budgets */}
          <div className="space-y-4">
            <SectionHeader
              eyebrow={t("Envelopes", "Sobres")}
              title={t("Your budgets", "Tus presupuestos")}
              description={
                totalBudgeted > 0
                  ? t(
                      `${formatCurrency(totalConsumed, baseCurrency)} spent of ${formatCurrency(totalBudgeted, baseCurrency)} · ${formatCurrency(Math.abs(totalRemaining), baseCurrency)} ${totalRemaining >= 0 ? "left" : "over"}`,
                      `${formatCurrency(totalConsumed, baseCurrency)} gastado de ${formatCurrency(totalBudgeted, baseCurrency)} · ${formatCurrency(Math.abs(totalRemaining), baseCurrency)} ${totalRemaining >= 0 ? "restante" : "excedido"}`
                    )
                  : undefined
              }
              action={
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleCopy}
                    disabled={copying}
                    aria-label={t("Copy budgets", "Copiar presupuestos")}
                  >
                    {copying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">
                      {t("Copy", "Copiar")}
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
                          {t("Add", "Añadir")}
                        </span>
                      </Button>
                    }
                  />
                </div>
              }
            />

            {customBudgets.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={t("No budgets yet", "Aún no hay presupuestos")}
                description={
                  profile?.wants_budget_help
                    ? t(
                        "Based on your goals, add envelopes for essentials, lifestyle, and savings — or start with one target.",
                        "Según tus metas, crea sobres para esenciales, estilo de vida y ahorro — o empieza con un objetivo."
                      )
                    : t(
                        "Create your first budget to set spending targets and track how much goes to each area of your life.",
                        "Crea tu primer presupuesto para definir objetivos de gasto y rastrear cuánto va a cada área de tu vida."
                      )
                }
              >
                <CustomBudgetForm
                  month={month}
                  year={year}
                  incomeAmount={incomeAmount}
                  incomeCurrency={plan?.income_currency ?? baseCurrency}
                  onSubmit={handleAddBudget}
                  trigger={
                    <Button variant="outline" className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      {t("Add your first budget", "Agrega tu primer presupuesto")}
                    </Button>
                  }
                />
              </EmptyState>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {customBudgets.map((budget, index) => {
                  const metrics = budgetMetrics.find((m) => m.id === budget.id);
                  return (
                    <CustomBudgetCard
                      key={budget.id}
                      budget={budget}
                      spent={metrics?.spent ?? 0}
                      resolvedAmount={metrics?.resolved ?? 0}
                      index={index}
                      onDelete={setDeleteId}
                      onEdit={setEditBudget}
                    />
                  );
                })}
              </div>
            )}
          </div>
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
