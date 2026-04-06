"use client";

import { useMemo, useState } from "react";
import { useBudgets } from "@/hooks/use-budgets";
import { useExpenses } from "@/hooks/use-expenses";
import { useMonthlyBudgetPlan } from "@/hooks/use-monthly-budget-plan";
import { useCurrency } from "@/providers/currency-provider";
import { calculateBudgetPoolMetrics } from "@/lib/budgeting";
import {
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
  getMonthName,
} from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { MonthlyPlanForm } from "@/components/budgets/monthly-plan-form";
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
  PiggyBank,
  Plus,
  Sparkles,
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
  const { baseCurrency, convert } = useCurrency();

  const { budgets, loading, addBudget, deleteBudget, copyFromPreviousMonth } =
    useBudgets({ month, year });
  const { expenses } = useExpenses({ month, year });
  const {
    plan,
    loading: planLoading,
    upsertPlan,
  } = useMonthlyBudgetPlan({ month, year });

  const spentByCategory = useMemo(() => {
    const result = new Map<string, { amount: number; currency: string }>();

    expenses.forEach((expense) => {
      const existing = result.get(expense.category_id);
      const convertedAmount = convert(expense.amount, expense.currency);

      if (existing) {
        existing.amount += convertedAmount;
      } else {
        result.set(expense.category_id, {
          amount: convertedAmount,
          currency: baseCurrency,
        });
      }
    });

    return result;
  }, [baseCurrency, convert, expenses]);

  const metrics = calculateBudgetPoolMetrics({
    plan,
    budgets,
    expenses,
    convert,
  });

  const sectionDescription = metrics.hasPlan
    ? t(
        `Shape ${getMonthName(month)} with a protected pool and assign envelopes with intention.`,
        `Diseña ${getMonthName(month)} con un fondo protegido y asigna sobres con intención.`
      )
    : t(
        "Your envelopes still work on their own, but a monthly plan will make spending left and consumed progress clearer.",
        "Tus sobres aún funcionan solos, pero un plan mensual hará más clara la lectura entre consumido y disponible."
      );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const error = await deleteBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);

    if (error) {
      toast.error(t("Could not delete envelope", "No se pudo eliminar el sobre"));
      return;
    }

    toast.success(t("Envelope removed", "Sobre eliminado"));
  }

  async function handleCopy() {
    setCopying(true);
    const count = await copyFromPreviousMonth();
    setCopying(false);

    if (count && count > 0) {
      toast.success(
        t(
          `Copied ${count} envelope${count !== 1 ? "s" : ""} from the previous month`,
          `Se copiaron ${count} sobre${count !== 1 ? "s" : ""} del mes anterior`
        )
      );
    } else {
      toast.info(t("No envelopes found in the previous month", "No se encontraron sobres en el mes anterior"));
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
      toast.error(t("Could not save the monthly plan", "No se pudo guardar el plan mensual"));
      return error;
    }

    toast.success(t("Monthly plan updated", "Plan mensual actualizado"));
    return error;
  }

  async function handleAddBudget(values: {
    amount: number;
    currency: string;
    category_id: string;
    month: number;
    year: number;
  }) {
    const error = await addBudget(values);

    if (error) {
      toast.error(t("Could not save the envelope", "No se pudo guardar el sobre"));
      return error;
    }

    toast.success(t("Envelope saved", "Sobre guardado"));
    return error;
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <PageHeader title={t("Budgets", "Presupuestos")} description={sectionDescription}>
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
          <span className="hidden md:inline">{t("Copy envelopes", "Copiar sobres")}</span>
        </Button>
        <BudgetForm
          month={month}
          year={year}
          onSubmit={handleAddBudget}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">{t("Add envelope", "Agregar sobre")}</span>
            </Button>
          }
        />
        <MonthlyPlanForm
          month={month}
          year={year}
          onSubmit={handleSavePlan}
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

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm md:rounded-[2rem] md:p-6 md:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.92)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-secondary/70 text-foreground">
                {metrics.hasPlan
                  ? t("Monthly pool active", "Fondo mensual activo")
                  : t("Envelope fallback", "Modo sobres")}
              </Badge>
              <div>
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  {metrics.hasPlan
                    ? t("Protected pool", "Fondo protegido")
                    : t("Envelope total", "Total de sobres")}
                </p>
                <p className="mt-3 font-heading text-[2rem] font-semibold leading-none tracking-[-0.05em] text-foreground md:text-[3.6rem]">
                  {formatCurrency(metrics.poolAmount, baseCurrency)}
                </p>
              </div>
              <p className="hidden max-w-xl text-sm leading-6 text-muted-foreground md:block">
                {metrics.hasPlan
                  ? t(
                      `You are protecting ${metrics.allocationPercent}% of ${formatCurrency(metrics.incomeAmount ?? 0, baseCurrency)} this month.`,
                      `Estás protegiendo el ${metrics.allocationPercent}% de ${formatCurrency(metrics.incomeAmount ?? 0, baseCurrency)} este mes.`
                    )
                  : t(
                      "Create a monthly plan to anchor envelopes to a single income-based pool and make left-versus-consumed progress easier to scan.",
                      "Crea un plan mensual para anclar los sobres a un solo fondo basado en ingresos y visualizar mejor lo disponible frente a lo consumido."
                    )}
              </p>
            </div>

            <div className="hidden rounded-[1.5rem] border border-border/70 bg-secondary/60 px-4 py-3 sm:block">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {getMonthName(month)} {year}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                {metrics.hasPlan
                  ? t("Stewardship plan in place", "Plan de mayordomía activo")
                  : t("No monthly plan yet", "Aún sin plan mensual")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 md:mt-6 md:gap-3">
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Consumed", "Consumido")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {formatCurrency(metrics.consumedAmount, baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Left", "Disponible")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {formatCurrency(Math.abs(metrics.remainingAmount), baseCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/50 p-3 md:rounded-[1.35rem] md:p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Assigned to envelopes", "Asignado a sobres")}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold md:mt-3 md:text-2xl">
                {formatCurrency(metrics.assignedCategoryBudgetTotal, baseCurrency)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("Pool usage", "Uso del fondo")}
              </span>
              <span className="font-mono text-foreground">
                {metrics.consumedPercent.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(metrics.consumedPercent, 100)}
              className="[&_[data-slot=progress-indicator]]:bg-[var(--chart-1)]"
            />
          </div>
        </div>

        <div className="hidden space-y-4 xl:block">
          <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm md:rounded-[2rem] md:p-5 md:shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {t("Envelope balance", "Balance de sobres")}
                </p>
                <p className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                  {formatCurrency(Math.abs(metrics.unassignedAmount), baseCurrency)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-6 text-muted-foreground md:block">
              {metrics.hasPlan
                ? metrics.isOverAssigned
                  ? t(
                      "Your envelopes are larger than the protected pool. Keep them if intentional, but the month will feel tighter from the start.",
                      "Tus sobres superan el fondo protegido. Si es intencional, mantenlos, pero el mes empezará con menos margen."
                    )
                  : t(
                      "This is still free inside the monthly pool. Use it for categories you have not assigned yet or leave it as flexibility.",
                      "Este monto sigue libre dentro del fondo mensual. Úsalo para categorías sin asignar o déjalo como flexibilidad."
                    )
                : t(
                    "Without a monthly plan, this section reflects the total reserved by envelopes only.",
                    "Sin plan mensual, esta sección muestra solo el total reservado por sobres."
                  )}
            </p>
            {metrics.isOverAssigned && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {t(
                    "Assigned envelopes exceed the monthly pool by",
                    "Los sobres asignados superan el fondo mensual por"
                  )}{" "}
                  {formatCurrency(
                    metrics.assignedCategoryBudgetTotal - metrics.poolAmount,
                    baseCurrency
                  )}
                  .
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
                  {metrics.hasPlan
                    ? formatCurrency(metrics.incomeAmount ?? 0, baseCurrency)
                    : t("Not set", "No definido")}
                </p>
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-6 text-muted-foreground md:block">
              {metrics.hasPlan
                ? t(
                    `${metrics.allocationPercent}% of income is protected for this month. Update it when your obligations or generosity goals change.`,
                    `Este mes está protegido el ${metrics.allocationPercent}% del ingreso. Actualízalo cuando cambien tus obligaciones o metas de generosidad.`
                  )
                : t(
                    "Start with a 20% plan if you want a simple default, then adjust the percentage when your month needs more room.",
                    "Comienza con un plan del 20% como base simple y ajusta el porcentaje cuando el mes necesite más margen."
                  )}
            </p>
          </div>
        </div>
      </section>

      {loading || planLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[240px] animate-pulse rounded-[1.75rem] bg-muted/60"
            />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={t("No category envelopes yet", "Aún no hay sobres por categoría")}
          description={t(
            "Start with a monthly plan, then reserve a few category envelopes for areas you want to guard more closely.",
            "Empieza con un plan mensual y luego reserva sobres por categoría para las áreas que quieras cuidar más."
          )}
        >
          <BudgetForm
            month={month}
            year={year}
            onSubmit={handleAddBudget}
            trigger={
              <Button variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t("Add your first envelope", "Agrega tu primer sobre")}
              </Button>
            }
          />
        </EmptyState>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Category envelopes", "Sobres por categoría")}
              </p>
              <h2 className="mt-2 font-heading text-[1.35rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                {t("Reserved with intention", "Reservado con intención")}
              </h2>
            </div>
            <p className="hidden max-w-md text-right text-sm leading-6 text-muted-foreground md:block">
              {t(
                "Review each envelope as a guardrail inside the month, not as a separate budget system.",
                "Revisa cada sobre como un límite dentro del mes, no como un sistema de presupuesto aparte."
              )}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {budgets.map((budget, index) => {
              const spent = spentByCategory.get(budget.category_id);

              return (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  spent={spent?.amount ?? 0}
                  spentCurrency={spent?.currency ?? baseCurrency}
                  index={index}
                  poolAmount={metrics.hasPlan ? metrics.poolAmount : undefined}
                  onDelete={setDeleteId}
                />
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{t("Delete envelope", "Eliminar sobre")}</DialogTitle>
            <DialogDescription>
              {t(
                "This only removes the category reserve. Your expense history will stay intact.",
                "Esto solo elimina la reserva de la categoría. Tu historial de gastos permanecerá intacto."
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
    </div>
  );
}
