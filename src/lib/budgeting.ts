import type { Database } from "@/types/database";

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type MonthlyBudgetPlanRow =
  Database["public"]["Tables"]["monthly_budget_plans"]["Row"];
type CustomBudgetRow = Database["public"]["Tables"]["custom_budgets"]["Row"];

interface BudgetPoolMetricsArgs {
  plan: MonthlyBudgetPlanRow | null;
  budgets: BudgetRow[];
  expenses: ExpenseRow[];
  convert: (amount: number, fromCurrency: string) => number;
}

export interface BudgetPoolMetrics {
  incomeAmount: number | null;
  allocationPercent: number | null;
  poolAmount: number;
  consumedAmount: number;
  remainingAmount: number;
  consumedPercent: number;
  assignedCategoryBudgetTotal: number;
  unassignedAmount: number;
  effectiveBudgetTotal: number;
  isOverAssigned: boolean;
  hasPlan: boolean;
}

export function sumConvertedAmounts<T extends { amount: number; currency: string }>(
  rows: T[],
  convert: (amount: number, fromCurrency: string) => number
) {
  return rows.reduce((sum, row) => sum + convert(row.amount, row.currency), 0);
}

export function calculateBudgetPoolMetrics({
  plan,
  budgets,
  expenses,
  convert,
}: BudgetPoolMetricsArgs): BudgetPoolMetrics {
  const assignedCategoryBudgetTotal = sumConvertedAmounts(budgets, convert);
  const consumedAmount = sumConvertedAmounts(expenses, convert);
  const incomeAmount = plan
    ? convert(plan.income_amount, plan.income_currency)
    : null;
  const poolAmount = plan
    ? incomeAmount! * (plan.allocation_percent / 100)
    : assignedCategoryBudgetTotal;
  const remainingAmount = poolAmount - consumedAmount;
  const consumedPercent = poolAmount > 0 ? (consumedAmount / poolAmount) * 100 : 0;
  const unassignedAmount = poolAmount - assignedCategoryBudgetTotal;

  return {
    incomeAmount,
    allocationPercent: plan?.allocation_percent ?? null,
    poolAmount,
    consumedAmount,
    remainingAmount,
    consumedPercent,
    assignedCategoryBudgetTotal,
    unassignedAmount,
    effectiveBudgetTotal: poolAmount,
    isOverAssigned: Boolean(plan) && assignedCategoryBudgetTotal > poolAmount,
    hasPlan: Boolean(plan),
  };
}

/* ------------------------------------------------------------------ */
/*  Custom Budgets                                                     */
/* ------------------------------------------------------------------ */

export function resolveCustomBudgetAmount(
  budget: Pick<CustomBudgetRow, "amount_type" | "amount_value" | "currency">,
  incomeAmount: number | null,
  convert: (amount: number, fromCurrency: string) => number
): number {
  if (budget.amount_type === "percentage") {
    if (incomeAmount === null || incomeAmount <= 0) return 0;
    return incomeAmount * (budget.amount_value / 100);
  }
  return convert(budget.amount_value, budget.currency);
}

/** Spent / limit. Spend with a zero limit counts as fully over budget. */
export function budgetUsageRatio(spent: number, limit: number): number {
  if (limit > 0) return spent / limit;
  if (spent > 0) return Number.POSITIVE_INFINITY;
  return 0;
}

export function calculateCustomBudgetSpending(
  categoryIds: string[],
  expenses: ExpenseRow[],
  convert: (amount: number, fromCurrency: string) => number
): number {
  const categorySet = new Set(categoryIds);
  return expenses
    .filter((e) => categorySet.has(e.category_id))
    .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
}
