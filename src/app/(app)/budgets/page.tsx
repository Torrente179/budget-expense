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
    ? `Shape ${getMonthName(month)} with a protected pool and assign envelopes with intention.`
    : `Your envelopes still work on their own, but a monthly plan will make spending left and consumed progress clearer.`;

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const error = await deleteBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);

    if (error) {
      toast.error("Could not delete envelope");
      return;
    }

    toast.success("Envelope removed");
  }

  async function handleCopy() {
    setCopying(true);
    const count = await copyFromPreviousMonth();
    setCopying(false);

    if (count && count > 0) {
      toast.success(
        `Copied ${count} envelope${count !== 1 ? "s" : ""} from the previous month`
      );
    } else {
      toast.info("No envelopes found in the previous month");
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
      toast.error("Could not save the monthly plan");
      return error;
    }

    toast.success("Monthly plan updated");
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
      toast.error("Could not save the envelope");
      return error;
    }

    toast.success("Envelope saved");
    return error;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Budgets" description={sectionDescription}>
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
          Copy envelopes
        </Button>
        <BudgetForm
          month={month}
          year={year}
          onSubmit={handleAddBudget}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add envelope
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
        <div className="rounded-[2rem] border border-border/80 bg-card/96 p-6 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.92)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-secondary/70 text-foreground">
                {metrics.hasPlan ? "Monthly pool active" : "Envelope fallback"}
              </Badge>
              <div>
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  {metrics.hasPlan ? "Protected pool" : "Envelope total"}
                </p>
                <p className="mt-3 font-heading text-[3.6rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                  {formatCurrency(metrics.poolAmount, baseCurrency)}
                </p>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                {metrics.hasPlan
                  ? `You are protecting ${metrics.allocationPercent}% of ${formatCurrency(metrics.incomeAmount ?? 0, baseCurrency)} this month.`
                  : "Create a monthly plan to anchor envelopes to a single income-based pool and make left-versus-consumed progress easier to scan."}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-secondary/60 px-4 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {getMonthName(month)} {year}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                {metrics.hasPlan ? "Stewardship plan in place" : "No monthly plan yet"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-border/70 bg-secondary/50 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                Consumed
              </p>
              <p className="mt-3 font-mono text-2xl font-semibold">
                {formatCurrency(metrics.consumedAmount, baseCurrency)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-border/70 bg-secondary/50 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                Left
              </p>
              <p className="mt-3 font-mono text-2xl font-semibold">
                {formatCurrency(Math.abs(metrics.remainingAmount), baseCurrency)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-border/70 bg-secondary/50 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                Assigned to envelopes
              </p>
              <p className="mt-3 font-mono text-2xl font-semibold">
                {formatCurrency(metrics.assignedCategoryBudgetTotal, baseCurrency)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pool usage</span>
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

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Envelope balance
                </p>
                <p className="font-heading text-[2rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatCurrency(Math.abs(metrics.unassignedAmount), baseCurrency)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {metrics.hasPlan
                ? metrics.isOverAssigned
                  ? "Your envelopes are larger than the protected pool. Keep them if intentional, but the month will feel tighter from the start."
                  : "This is still free inside the monthly pool. Use it for categories you have not assigned yet or leave it as flexibility."
                : "Without a monthly plan, this section reflects the total reserved by envelopes only."}
            </p>
            {metrics.isOverAssigned && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Assigned envelopes exceed the monthly pool by{" "}
                  {formatCurrency(
                    metrics.assignedCategoryBudgetTotal - metrics.poolAmount,
                    baseCurrency
                  )}
                  .
                </span>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Monthly income
                </p>
                <p className="mt-1 text-lg font-medium">
                  {metrics.hasPlan
                    ? formatCurrency(metrics.incomeAmount ?? 0, baseCurrency)
                    : "Not set"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {metrics.hasPlan
                ? `${metrics.allocationPercent}% of income is protected for this month. Update it when your obligations or generosity goals change.`
                : "Start with a 20% plan if you want a simple default, then adjust the percentage when your month needs more room."}
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
          title="No category envelopes yet"
          description="Start with a monthly plan, then reserve a few category envelopes for areas you want to guard more closely."
        >
          <BudgetForm
            month={month}
            year={year}
            onSubmit={handleAddBudget}
            trigger={
              <Button variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add your first envelope
              </Button>
            }
          />
        </EmptyState>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                Category envelopes
              </p>
              <h2 className="mt-2 font-heading text-[2rem] font-semibold leading-none tracking-[-0.04em]">
                Reserved with intention
              </h2>
            </div>
            <p className="max-w-md text-right text-sm leading-6 text-muted-foreground">
              Review each envelope as a guardrail inside the month, not as a
              separate budget system.
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
            <DialogTitle>Delete envelope</DialogTitle>
            <DialogDescription>
              This only removes the category reserve. Your expense history will
              stay intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
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
