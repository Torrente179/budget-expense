"use client";

import { useState } from "react";
import { useBudgets } from "@/hooks/use-budgets";
import { useExpenses } from "@/hooks/use-expenses";
import { useCurrency } from "@/providers/currency-provider";
import {
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
} from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PiggyBank, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const { baseCurrency, convert } = useCurrency();

  const { budgets, loading, addBudget, deleteBudget, copyFromPreviousMonth } =
    useBudgets({ month, year });
  const { expenses } = useExpenses({ month, year });

  // Calculate spent per category
  const spentByCategory = new Map<string, { amount: number; currency: string }>();
  expenses.forEach((e) => {
    const existing = spentByCategory.get(e.category_id);
    if (existing) {
      existing.amount += convert(e.amount, e.currency);
    } else {
      spentByCategory.set(e.category_id, {
        amount: convert(e.amount, e.currency),
        currency: baseCurrency,
      });
    }
  });

  const totalBudget = budgets.reduce(
    (sum, b) => sum + convert(b.amount, b.currency),
    0
  );
  const totalSpent = expenses.reduce(
    (sum, e) => sum + convert(e.amount, e.currency),
    0
  );
  const overallPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await deleteBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);
  }

  async function handleCopy() {
    setCopying(true);
    const count = await copyFromPreviousMonth();
    setCopying(false);
    if (count && count > 0) {
      toast.success(`Copied ${count} budget${count !== 1 ? "s" : ""} from previous month`);
    } else {
      toast.info("No budgets found in the previous month");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets">
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
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
          Copy previous
        </Button>
        <BudgetForm month={month} year={year} onSubmit={addBudget} />
      </PageHeader>

      {/* Overall progress */}
      {budgets.length > 0 && (
        <div className="rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total budget</p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatCurrency(totalSpent, baseCurrency)} of{" "}
                {formatCurrency(totalBudget, baseCurrency)}
              </p>
            </div>
            <span
              className={`font-mono text-sm font-medium ${
                overallPercentage >= 90
                  ? "text-red-500"
                  : overallPercentage >= 75
                    ? "text-amber-500"
                    : "text-emerald-500"
              }`}
            >
              {overallPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(overallPercentage, 100)}
            className={`mt-3 h-2 ${
              overallPercentage >= 90
                ? "[&>div]:bg-red-500"
                : overallPercentage >= 75
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-emerald-500"
            }`}
          />
        </div>
      )}

      {/* Budget grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-lg bg-muted/50"
            />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set"
          description="Set budgets per category to track your spending limits."
        >
          <BudgetForm month={month} year={year} onSubmit={addBudget} />
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget, i) => {
            const spent = spentByCategory.get(budget.category_id);
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={spent?.amount ?? 0}
                spentCurrency={spent?.currency ?? baseCurrency}
                index={i}
                onDelete={setDeleteId}
              />
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Delete budget</DialogTitle>
            <DialogDescription>
              Remove this budget entry? Your expense data will not be affected.
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
    </div>
  );
}
