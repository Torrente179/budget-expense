import type { Database } from "@/types/database";

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type MonthlyBudgetPlanRow =
  Database["public"]["Tables"]["monthly_budget_plans"]["Row"];

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
