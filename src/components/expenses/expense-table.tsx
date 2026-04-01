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

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onUpdate: (
    id: string,
    data: Database["public"]["Tables"]["expenses"]["Update"]
  ) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function ExpenseTable({
  expenses,
  loading,
  onUpdate,
  onDelete,
}: ExpenseTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        title="No expenses yet"
        description="Add your first expense to start tracking spending with more context and clarity."
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
            className="group rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-[0_22px_55px_-42px_rgba(31,29,23,0.42)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_180px_minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Expense
                </p>
                <p className="mt-2 truncate text-base font-medium text-foreground">
                  {expense.description || expense.categories.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CategoryBadge
                    name={expense.categories.name}
                    icon={expense.categories.icon}
                    color={expense.categories.color}
                    size="md"
                    className="rounded-xl px-2.5 py-1"
                  />
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {formatDate(expense.date, "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/72 p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  Date
                </p>
                <p className="mt-2 font-mono text-sm text-foreground">
                  {formatDate(expense.date, "EEEE, MMM d")}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/72 p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  Ledger note
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {expense.description || "No description added yet"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end lg:text-right">
                <CurrencyDisplay
                  amount={expense.amount}
                  currency={expense.currency}
                  className="font-heading text-2xl leading-none tracking-tight"
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
                    onSubmit={async (values) => onUpdate(expense.id, values)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
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
            <DialogTitle>Delete expense</DialogTitle>
            <DialogDescription>
              This removes the record from the current month. Your budget and
              category totals will recalculate automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-background/70 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
