"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useExpenses } from "@/hooks/use-expenses";
import { useBudgets } from "@/hooks/use-budgets";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  formatCurrency,
  formatDate,
  getCurrentMonth,
  getCurrentYear,
  getMonthName,
} from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/category-badge";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Receipt,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CategoryDetailPage() {
  const { locale, t, tc } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const month = Number(searchParams.get("month")) || getCurrentMonth();
  const year = Number(searchParams.get("year")) || getCurrentYear();
  const categoryId = params.id;
  const origin = searchParams.get("from") === "dashboard" ? "dashboard" : "analytics";
  const hasOrigin = searchParams.has("from");

  const {
    expenses,
    loading,
    updateExpense,
    deleteExpense,
  } = useExpenses({ month, year, categoryId });

  const { budgets } = useBudgets({ month, year });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Category metadata from first expense */
  const category = useMemo(() => {
    const first = expenses[0];
    if (!first?.categories) return null;
    return {
      name: first.categories.name as string,
      icon: first.categories.icon as string,
      color: first.categories.color as string,
    };
  }, [expenses]);

  /* Category name from budget if no expenses */
  const categoryFromBudget = useMemo(() => {
    if (category) return null;
    const b = budgets.find((b) => b.category_id === categoryId);
    if (!b) return null;
    return {
      name: b.categories.name,
      icon: b.categories.icon,
      color: b.categories.color,
    };
  }, [category, budgets, categoryId]);

  const catMeta = category ?? categoryFromBudget;

  /* Totals */
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0),
    [expenses, convert]
  );

  /* Budget for this category */
  const budget = useMemo(() => {
    const b = budgets.find((b) => b.category_id === categoryId);
    if (!b) return null;
    const amount = convert(b.amount, b.currency);
    return { amount, percent: amount > 0 ? (totalSpent / amount) * 100 : 0 };
  }, [budgets, categoryId, convert, totalSpent]);

  /* Group expenses by date */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof expenses>();
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    for (const exp of sorted) {
      const existing = map.get(exp.date) ?? [];
      existing.push(exp);
      map.set(exp.date, existing);
    }
    return map;
  }, [expenses]);

  const monthLabel = `${getMonthName(month, locale)} ${year}`;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteExpense(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
  }

  function handleBack() {
    if (hasOrigin && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(origin === "dashboard" ? "/dashboard" : "/analytics");
  }

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Back link */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {origin === "dashboard"
          ? t("Back to Dashboard", "Volver al panel")
          : t("Back to Analytics", "Volver a Analítica")}
      </button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[160px] rounded-[1.75rem]" />
          <Skeleton className="h-[320px] rounded-[1.75rem]" />
        </div>
      ) : (
        <>
          {/* Category header card */}
          <Card className="border-border/80 bg-card/96 p-5">
            <div className="flex items-start gap-4">
              {catMeta && (
                <CategoryIcon
                  icon={catMeta.icon}
                  color={catMeta.color}
                  className="h-12 w-12 shrink-0 rounded-2xl"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {monthLabel}
                </p>
                <h1 className="mt-1 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em] md:text-[2.2rem]">
                  {catMeta ? tc(catMeta.name) : t("Category", "Categoría")}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="font-mono text-lg font-semibold">
                    {formatCurrency(totalSpent, baseCurrency)}
                  </p>
                  <Badge variant="outline" className="bg-secondary/70">
                    {expenses.length}{" "}
                    {expenses.length === 1
                      ? t("transaction", "transacción")
                      : t("transactions", "transacciones")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Budget progress */}
            {budget && (
              <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("Budget", "Presupuesto")}
                  </span>
                  <div className="flex items-center gap-2">
                    {budget.percent > 100 && (
                      <Badge
                        variant="outline"
                        className="border-red-500/20 bg-red-500/10 text-[0.6rem] text-red-600 dark:text-red-400"
                      >
                        {t("Over", "Excedido")}
                      </Badge>
                    )}
                    <span className="font-mono text-xs">
                      {formatCurrency(totalSpent, baseCurrency)} /{" "}
                      {formatCurrency(budget.amount, baseCurrency)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.min(budget.percent, 100)}
                  className={`mt-2 h-2 ${
                    budget.percent >= 90
                      ? "[&_[data-slot=progress-indicator]]:bg-red-500"
                      : budget.percent >= 75
                        ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                        : "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                  }`}
                />
                <p className="mt-1.5 text-right text-[0.65rem] text-muted-foreground">
                  {budget.percent.toFixed(0)}% {t("used", "usado")}
                </p>
              </div>
            )}
          </Card>

          {/* Expense list */}
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("No expenses", "Sin gastos")}
              description={t(
                "No expenses found for this category this month.",
                "No se encontraron gastos para esta categoría este mes."
              )}
            />
          ) : (
            <div className="space-y-6">
              {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date}>
                  <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDate(date, "EEEE d MMMM yyyy")}
                  </p>
                  <div className="divide-y divide-border/40">
                    {items.map((expense, i) => {
                      const converted = convert(expense.amount, expense.currency);

                      const rowContent = (
                        <button className="flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-secondary/40">
                          {catMeta && (
                            <CategoryIcon
                              icon={catMeta.icon}
                              color={catMeta.color}
                              className="h-9 w-9 shrink-0 rounded-xl"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {expense.description || (catMeta ? tc(catMeta.name) : "—")}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {expense.currency !== baseCurrency
                                ? `${formatCurrency(expense.amount, expense.currency)} → `
                                : ""}
                              {formatCurrency(converted, baseCurrency)}
                            </p>
                          </div>
                          <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                            -{formatCurrency(converted, baseCurrency)}
                          </p>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        </button>
                      );

                      return (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: i * 0.02,
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="group flex items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <ExpenseForm
                              defaultValues={{
                                amount: expense.amount,
                                currency: expense.currency,
                                category_id: expense.category_id,
                                description: expense.description ?? "",
                                date: expense.date,
                              }}
                              onSubmit={async (values) =>
                                updateExpense(expense.id, values)
                              }
                              trigger={rowContent}
                            />
                          </div>
                          <button
                            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl opacity-30 transition-opacity hover:bg-destructive/10 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            onClick={() => setDeleteTarget(expense.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-[1.75rem] border-border/70 bg-popover/96 p-5 sm:max-w-[380px]">
          <DialogHeader className="space-y-3">
            <DialogTitle>{t("Delete expense", "Eliminar gasto")}</DialogTitle>
            <DialogDescription>
              {t(
                "This expense will be removed. Totals will recalculate automatically.",
                "Este gasto se eliminará. Los totales se recalcularán automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
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
