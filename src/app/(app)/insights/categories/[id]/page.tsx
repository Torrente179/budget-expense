"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { Screen } from "@/components/patterns/screen";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { CategoryIcon } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CaptureSheet,
  type CaptureInitialValues,
} from "@/components/capture/capture-sheet";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, Receipt, Trash2 } from "lucide-react";

function CategoryDetail() {
  const { locale, t, tc } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const month = Number(searchParams.get("month")) || getCurrentMonth();
  const year = Number(searchParams.get("year")) || getCurrentYear();
  const categoryId = params.id;
  const backHref =
    searchParams.get("from") === "dashboard" ? "/home" : "/insights";

  const { expenses, loading, deleteExpense } = useExpenses({
    month,
    year,
    categoryId,
  });
  const { budgets } = useBudgets({ month, year });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<CaptureInitialValues | null>(
    null
  );

  const catMeta = useMemo(() => {
    const fromExpense = expenses[0]?.categories;
    if (fromExpense) {
      return {
        name: fromExpense.name,
        icon: fromExpense.icon,
        color: fromExpense.color,
      };
    }
    const fromBudget = budgets.find((b) => b.category_id === categoryId);
    if (fromBudget) {
      return {
        name: fromBudget.categories.name,
        icon: fromBudget.categories.icon,
        color: fromBudget.categories.color,
      };
    }
    return null;
  }, [expenses, budgets, categoryId]);

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + convert(expense.amount, expense.currency),
        0
      ),
    [expenses, convert]
  );

  const budget = useMemo(() => {
    const match = budgets.find((b) => b.category_id === categoryId);
    if (!match) return null;
    const amount = convert(match.amount, match.currency);
    return { amount, ratio: amount > 0 ? totalSpent / amount : 0 };
  }, [budgets, categoryId, convert, totalSpent]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof expenses>();
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    for (const expense of sorted) {
      const existing = map.get(expense.date) ?? [];
      existing.push(expense);
      map.set(expense.date, existing);
    }
    return map;
  }, [expenses]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteExpense(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <Screen
      eyebrow={`${getMonthName(month, locale)} ${year}`}
      title={catMeta ? tc(catMeta.name) : t("Category", "Categoría")}
      backHref={backHref}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {catMeta && (
                  <CategoryIcon
                    icon={catMeta.icon}
                    color={catMeta.color}
                    className="h-12 w-12 shrink-0 rounded-xl"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-mono text-title font-semibold tabular-nums text-foreground">
                    {formatCurrency(totalSpent, baseCurrency)}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {expenses.length}{" "}
                    {expenses.length === 1
                      ? t("transaction", "transacción")
                      : t("transactions", "transacciones")}
                  </p>
                </div>
              </div>

              {budget && (
                <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2 text-body">
                    <span className="text-muted-foreground">
                      {t("Budget", "Presupuesto")}
                      {budget.ratio > 1 && (
                        <span className="ml-2 rounded-full bg-danger-subtle px-2 py-0.5 text-label font-medium text-danger">
                          {t("Over", "Excedido")}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-caption tabular-nums text-muted-foreground">
                      <span className="text-foreground">
                        {formatCurrency(totalSpent, baseCurrency)}
                      </span>
                      {" / "}
                      {formatCurrency(budget.amount, baseCurrency)}
                    </span>
                  </div>
                  <ProgressMeter ratio={budget.ratio} className="mt-2" />
                  <p className="mt-1.5 text-right text-label text-muted-foreground">
                    {(budget.ratio * 100).toFixed(0)}% {t("used", "usado")}
                  </p>
                </div>
              )}
            </CardContent>
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
                <section key={date}>
                  <p className="label-caps mb-1.5 px-4 md:px-0">
                    {formatDate(date, "EEEE d MMMM yyyy", locale)}
                  </p>
                  <div className="-mx-4 divide-y divide-border/40 md:mx-0 md:overflow-hidden md:rounded-xl md:bg-card md:ring-1 md:ring-border md:shadow-1">
                    {items.map((expense) => (
                      <div key={expense.id} className="group flex items-center">
                        <div className="min-w-0 flex-1">
                          <TransactionRow
                            title={
                              expense.description ||
                              (catMeta ? tc(catMeta.name) : "—")
                            }
                            subtitle={
                              expense.currency !== baseCurrency
                                ? formatCurrency(
                                    expense.amount,
                                    expense.currency
                                  )
                                : undefined
                            }
                            amount={expense.amount}
                            currency={expense.currency}
                            kind="expense"
                            category={
                              catMeta
                                ? { icon: catMeta.icon, color: catMeta.color }
                                : null
                            }
                            needsReview={expense.needs_review}
                            onClick={() =>
                              setEditTarget({
                                id: expense.id,
                                amount: expense.amount,
                                currency: expense.currency,
                                categoryId: expense.category_id,
                                date: expense.date,
                                description: expense.description ?? "",
                              })
                            }
                          />
                        </div>
                        <button
                          aria-label={t("Delete", "Eliminar")}
                          className="mr-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-danger-subtle group-hover:opacity-100 md:flex"
                          onClick={() => setDeleteTarget(expense.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit */}
      <CaptureSheet
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        mode="edit"
        kind="expense"
        initialValues={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="p-5 sm:max-w-[380px]">
          <DialogHeader className="space-y-3">
            <DialogTitle>{t("Delete expense", "Eliminar gasto")}</DialogTitle>
            <DialogDescription>
              {t(
                "This expense will be removed. Totals will recalculate automatically.",
                "Este gasto se eliminará. Los totales se recalcularán automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
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

export default function CategoryDetailPage() {
  return (
    <Suspense>
      <CategoryDetail />
    </Suspense>
  );
}
