"use client";

import { useState } from "react";
import type { Database } from "@/types/database";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-muted/50"
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
        description="Add your first expense to start tracking your spending."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, i) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {formatDate(expense.date, "MMM d")}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge
                      name={expense.categories.name}
                      icon={expense.categories.icon}
                      color={expense.categories.color}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {expense.description || (
                      <span className="text-muted-foreground/50">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay
                      amount={expense.amount}
                      currency={expense.currency}
                      className="text-sm font-medium"
                      showOriginal
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ExpenseForm
                        defaultValues={{
                          amount: expense.amount,
                          currency: expense.currency,
                          category_id: expense.category_id,
                          description: expense.description ?? "",
                          date: expense.date,
                        }}
                        onSubmit={async (values) =>
                          onUpdate(expense.id, values)
                        }
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {expenses.map((expense, i) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
            className="flex items-center justify-between rounded-lg border border-border/50 p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${expense.categories.color}15`,
                }}
              >
                <CategoryBadge
                  name=""
                  icon={expense.categories.icon}
                  color={expense.categories.color}
                  className="border-0 bg-transparent px-0"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {expense.description || expense.categories.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(expense.date, "MMM d")} &middot;{" "}
                  {expense.categories.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyDisplay
                amount={expense.amount}
                currency={expense.currency}
                className="text-sm font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(expense.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Delete expense</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This expense will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
