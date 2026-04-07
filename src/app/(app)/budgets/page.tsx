"use client";

import { useMemo, useState } from "react";
import { useCustomBudgets, type CustomBudget } from "@/hooks/use-custom-budgets";
import { useExpenses } from "@/hooks/use-expenses";
import { useMonthlyBudgetPlan } from "@/hooks/use-monthly-budget-plan";
import { useCurrency } from "@/providers/currency-provider";
import {
  resolveCustomBudgetAmount,
  calculateCustomBudgetSpending,
  sumConvertedAmounts,
} from "@/lib/budgeting";
import {
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
  getMonthName,
} from "@/lib/utils";
import type { BudgetingMethod } from "@/lib/budgeting-methods";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { CustomBudgetForm } from "@/components/budgets/custom-budget-form";
import { CustomBudgetCard } from "@/components/budgets/custom-budget-card";
import { MonthlyPlanForm } from "@/components/budgets/monthly-plan-form";
import { MethodSelector } from "@/components/budgets/method-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CircleDollarSign,
  Copy,
  Loader2,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/providers/locale-provider";

export default function BudgetsPage() {
  const { t } = useLocale();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [appliedMethod, setAppliedMethod] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<CustomBudget | null>(null);
  const { baseCurrency, convert } = useCurrency();

  const {
    customBudgets,
    loading,
    addCustomBudget,
    updateCustomBudget,
    deleteCustomBudget,
    copyFromPreviousMonth,
  } = useCustomBudgets({ month, year });

  const { expenses } = useExpenses({ month, year });
  const {
    plan,
    loading: planLoading,
    upsertPlan,
  } = useMonthlyBudgetPlan({ month, year });

  const incomeAmount = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;

  // Pre-compute resolved amounts and spending per budget
  const budgetMetrics = useMemo(() => {
    return customBudgets.map((budget) => {
      const categoryIds = budget.custom_budget_categories.map(
        (c) => c.category_id
      );
      const resolved = resolveCustomBudgetAmount(budget, incomeAmount, convert);
      const spent = calculateCustomBudgetSpending(
        categoryIds,
        expenses,
        convert
      );
      return { id: budget.id, resolved, spent };
    });
  }, [customBudgets, incomeAmount, expenses, convert]);

  // Pool-level summary
  const totalBudgeted = budgetMetrics.reduce((s, m) => s + m.resolved, 0);
  const totalConsumed = sumConvertedAmounts(expenses, convert);
  const totalRemaining = totalBudgeted - totalConsumed;
  const consumedPercent =
    totalBudgeted > 0 ? (totalConsumed / totalBudgeted) * 100 : 0;
  const hasPlan = Boolean(plan);

  const sectionDescription = hasPlan
    ? t(
        `Shape ${getMonthName(month)} with your income-based budgets and track spending with intention.`,
        `Diseña ${getMonthName(month)} con presupuestos basados en tu ingreso y rastrea tus gastos con intención.`
      )
    : t(
        "Create budgets to set spending targets and track how much goes to each area of your life.",
        "Crea presupuestos para definir objetivos de gasto y rastrear cuánto va a cada área de tu vida."
      );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const error = await deleteCustomBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);

    if (error) {
      toast.error(
        t(
          "Could not delete budget",
          "No se pudo eliminar el presupuesto"
        )
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
        t(
          "Could not save the budget",
          "No se pudo guardar el presupuesto"
        )
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
    toast.success(t("Budget updated", "Presupuesto actualizado"));
    return error;
  }

  function handleApplyMethod(method: BudgetingMethod) {
    const totalAllocation = method.slices.reduce(
      (sum, s) => sum + s.percent,
      0
    );
    setAppliedMethod(method.id);

    toast.success(
      t(
        `${method.name} method applied — ${totalAllocation}% allocation. Open the monthly plan to fine-tune income and percentages.`,
        `Método ${method.name} aplicado — ${totalAllocation}% de asignación. Abre el plan mensual para ajustar ingreso y porcentajes.`
      ),
      { duration: 5000 }
    );
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <PageHeader
        title={t("Budgets", "Presupuestos")}
        description={sectionDescription}
      >
        <MonthPicker
          month={month}
          year={year}
          onChange={(nextMonth, nextYear) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleCopy}
          disabled={copying}
        >
          {copying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden md:inline">
            {t("Copy budgets", "Copiar presupuestos")}
          </span>
        </Button>
        <MethodSelector onApply={handleApplyMethod} />
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
                {t("Add budget", "Agregar presupuesto")}
              </span>
            </Button>
          }
        />
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
      </PageHeader>

      {/* Summary cards */}
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm md:rounded-[2rem] md:p-6 md:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.92)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="bg-secondary/70 text-foreground"
              >
                {hasPlan
                  ? t("Monthly plan active", "Plan mensual activo")
                  : t("Budget tracking", "Seguimiento de presupuestos")}
              </Badge>
              <div>
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  {t("Budget total", "Total presupuestado")}
                </p>
                <p className="mt-3 font-heading text-[2rem] font-semibold leading-none tracking-[-0.05em] text-foreground md:text-[3.6rem]">
                  {formatCurrency(totalBudgeted, baseCurrency)}
                </p>
              </div>
              <p className="hidden max-w-xl text-sm leading-6 text-muted-foreground md:block">
                {hasPlan
                  ? t(
                      `Your monthly income is ${formatCurrency(incomeAmount ?? 0, baseCurrency)}. Budgets can use fixed amounts or a percentage of this income.`,
                      `Tu ingreso mensual es ${formatCurrency(incomeAmount ?? 0, baseCurrency)}. Los presupuestos pueden usar montos fijos o un porcentaje de este ingreso.`
                    )
                  : t(
                      "Create a monthly plan to unlock percentage-based budgets that automatically adjust to your income.",
                      "Crea un plan mensual para desbloquear presupuestos por porcentaje que se ajustan automáticamente a tu ingreso."
                    )}
              </p>
            </div>

            <div className="hidden rounded-[1.5rem] border border-border/70 bg-secondary/60 px-4 py-3 sm:block">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {getMonthName(month)} {year}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                {hasPlan
                  ? t("Income plan in place", "Plan de ingreso activo")
                  : t("No monthly plan yet", "Aún sin plan mensual")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 md:mt-6 md:gap-3">
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Spent", "Gastado")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {formatCurrency(totalConsumed, baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Remaining", "Restante")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {formatCurrency(Math.abs(totalRemaining), baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Budgets", "Presupuestos")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {customBudgets.length}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("Budget usage", "Uso del presupuesto")}
              </span>
              <span className="font-mono text-foreground">
                {consumedPercent.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(consumedPercent, 100)}
              className="[&_[data-slot=progress-indicator]]:bg-[var(--chart-1)]"
            />
          </div>
        </div>

        <div className="hidden space-y-4 xl:block">
          <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm md:rounded-[2rem] md:p-5 md:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {totalRemaining >= 0
                    ? t("Available to spend", "Disponible para gastar")
                    : t("Overspent by", "Excedido por")}
                </p>
                <p className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                  {formatCurrency(Math.abs(totalRemaining), baseCurrency)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-6 text-muted-foreground md:block">
              {totalRemaining >= 0
                ? t(
                    "This is how much room you still have across all budgets combined. Each budget tracks its own categories independently.",
                    "Este es el margen que aún tienes en todos los presupuestos combinados. Cada presupuesto rastrea sus categorías de forma independiente."
                  )
                : t(
                    "Your total spending has exceeded your combined budgets. Review individual budgets to see where adjustments are needed.",
                    "Tu gasto total ha superado tus presupuestos combinados. Revisa cada presupuesto para ver dónde ajustar."
                  )}
            </p>
            {totalRemaining < 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {t(
                    "Total spending exceeds budgets by",
                    "El gasto total supera los presupuestos por"
                  )}{" "}
                  {formatCurrency(Math.abs(totalRemaining), baseCurrency)}.
                </span>
              </div>
            )}
          </div>

          <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm md:rounded-[2rem] md:p-5 md:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {t("Monthly income", "Ingreso mensual")}
                </p>
                <p className="mt-1 text-lg font-medium">
                  {hasPlan
                    ? formatCurrency(incomeAmount ?? 0, baseCurrency)
                    : t("Not set", "No definido")}
                </p>
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-6 text-muted-foreground md:block">
              {hasPlan
                ? t(
                    "Percentage-based budgets will resolve using this income. Update it when your income changes.",
                    "Los presupuestos por porcentaje se calculan usando este ingreso. Actualízalo cuando tu ingreso cambie."
                  )
                : t(
                    "Set a monthly plan to enable percentage-based budgets that adjust automatically to your income.",
                    "Define un plan mensual para habilitar presupuestos por porcentaje que se ajustan automáticamente a tu ingreso."
                  )}
            </p>
          </div>
        </div>
      </section>

      {/* Budget grid */}
      {loading || planLoading ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[280px] animate-pulse rounded-[1.75rem] bg-muted/60"
            />
          ))}
        </div>
      ) : customBudgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t("No budgets yet", "Aún no hay presupuestos")}
          description={t(
            "Create your first budget to set spending targets and track how much goes to each area of your life.",
            "Crea tu primer presupuesto para definir objetivos de gasto y rastrear cuánto va a cada área de tu vida."
          )}
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
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Your budgets", "Tus presupuestos")}
              </p>
              <h2 className="mt-2 font-heading text-[1.35rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                {t("Spending with intention", "Gasto con intención")}
              </h2>
            </div>
            <p className="hidden max-w-md text-right text-sm leading-6 text-muted-foreground md:block">
              {t(
                "Each budget groups categories together and tracks spending against your target.",
                "Cada presupuesto agrupa categorías y rastrea el gasto contra tu objetivo."
              )}
            </p>
          </div>

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
        </section>
      )}

      {/* Edit budget sheet */}
      <CustomBudgetForm
        key={editBudget?.id ?? "edit"}
        month={month}
        year={year}
        incomeAmount={incomeAmount}
        incomeCurrency={plan?.income_currency ?? baseCurrency}
        onSubmit={handleEditBudget}
        controlledOpen={!!editBudget}
        onOpenChange={(v) => {
          if (!v) setEditBudget(null);
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
              {deleting && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
