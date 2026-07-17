import {
  calculateCustomBudgetSpending,
  resolveCustomBudgetAmount,
} from "@/lib/budgeting";
import type { CustomBudget } from "@/hooks/use-custom-budgets";
import type { Database } from "@/types/database";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export type EnvelopeThreshold = 75 | 90 | 100;

export interface EnvelopeAlert {
  budgetId: string;
  name: string;
  percentUsed: number;
  threshold: EnvelopeThreshold;
}

function highestThreshold(percentUsed: number): EnvelopeThreshold | null {
  if (percentUsed >= 100) return 100;
  if (percentUsed >= 90) return 90;
  if (percentUsed >= 75) return 75;
  return null;
}

export function computeEnvelopeAlerts(input: {
  budgets: CustomBudget[];
  expenses: ExpenseRow[];
  incomeAmount: number | null;
  convert: (amount: number, fromCurrency: string) => number;
}): EnvelopeAlert[] {
  const alerts: EnvelopeAlert[] = [];

  for (const budget of input.budgets) {
    const target = resolveCustomBudgetAmount(
      budget,
      input.incomeAmount,
      input.convert
    );
    if (target <= 0) continue;

    const categoryIds = budget.custom_budget_categories.map(
      (link) => link.category_id
    );
    const spent = calculateCustomBudgetSpending(
      categoryIds,
      input.expenses,
      input.convert
    );
    const percentUsed = (spent / target) * 100;
    const threshold = highestThreshold(percentUsed);
    if (!threshold) continue;

    alerts.push({
      budgetId: budget.id,
      name: budget.name,
      percentUsed,
      threshold,
    });
  }

  return alerts.sort((a, b) => b.percentUsed - a.percentUsed);
}

const SESSION_KEY = "be-envelope-alert-toasts";

export function shouldToastEnvelopeAlert(
  budgetId: string,
  threshold: EnvelopeThreshold
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const seen = raw ? (JSON.parse(raw) as string[]) : [];
    const key = `${budgetId}:${threshold}`;
    if (seen.includes(key)) return false;
    seen.push(key);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen));
    return true;
  } catch {
    return true;
  }
}
