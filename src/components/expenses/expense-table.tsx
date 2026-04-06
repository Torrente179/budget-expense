"use client";

import { useState } from "react";
import type { Database } from "@/types/database";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2, Receipt } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { EmptyState } from "@/components/shared/empty-state";
import { motion } from "framer-motion";
import { useLocale } from "@/providers/locale-provider";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
};
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onUpdate: (
    id: string,
    data: Database["public"]["Tables"]["expenses"]["Update"]
  ) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  categories: Category[];
}

export function ExpenseTable({
  expenses,
  loading,
  onUpdate,
  onDelete,
  categories,
}: ExpenseTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useLocale();

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await onDelete(deleteId);
    setDeleting(false);
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[148px] animate-pulse rounded-[1.5rem] border border-border/60 bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={t("No expenses yet", "Aún no hay gastos")}
        description={t(
          "Add your first expense to start tracking spending with more context and clarity.",
          "Agrega tu primer gasto para empezar a registrar con más contexto y claridad."
        )}
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-[1.5rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.84)] transition-colors duration-200 hover:bg-secondary/35"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-foreground">
                  {expense.description || expense.categories?.name || "Uncategorized"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <CategoryBadge
                    name={expense.categories?.name || "Uncategorized"}
                    icon={expense.categories?.icon || "receipt"}
                    color={expense.categories?.color || "#64748b"}
                    size="md"
                    className="rounded-xl px-2.5 py-1"
                  />
                  <span>
                    {formatDate(expense.date, "MMM d, yyyy")}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                  <span className="hidden sm:inline-flex">
                    {expense.currency}
                  </span>
                  {expense.created_at !== expense.updated_at && (
                    <>
                      <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                      <span className="hidden text-muted-foreground/60 sm:inline-flex">
                        {t("edited", "editado")} {formatDate(expense.updated_at, "MMM d")}
                      </span>
                    </>
                  )}
                </div>
                {expense.description && expense.description !== expense.categories?.name && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {expense.categories?.name || "Uncategorized"}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:text-right">
                <CurrencyDisplay
                  amount={expense.amount}
                  currency={expense.currency}
                  className="font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]"
                  showOriginal
                />
                <div className="flex items-center gap-1">
                  <ExpenseForm
                    defaultValues={{
                      amount: expense.amount,
                      currency: expense.currency,
                      category_id: expense.category_id,
                      description: expense.description ?? "",
                      date: expense.date,
                    }}
                    categories={categories}
                    onSubmit={async (values) => onUpdate(expense.id, values)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[1.75rem] border-border/70 bg-popover/96 p-5">
          <DialogHeader className="space-y-3">
            <DialogTitle>{t("Delete expense", "Eliminar gasto")}</DialogTitle>
            <DialogDescription>
              {t(
                "This removes the record from the current month. Your budget and category totals will recalculate automatically.",
                "Esto elimina el registro del mes actual. Los totales de presupuesto y categorías se recalcularán automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
