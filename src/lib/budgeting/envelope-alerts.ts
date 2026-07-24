import {
  calculateCustomBudgetSpending,
  resolveCustomBudgetAmount,
} from "@/lib/budgeting";
import type { CustomBudget } from "@/hooks/use-custom-budgets";
import type { Database } from "@/types/database";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export type EnvelopeThreshold = number;

export interface EnvelopeAlert {
  budgetId: string;
  name: string;
  percentUsed: number;
  threshold: EnvelopeThreshold;
}

/** No custom threshold set → the original ladder. */
const DEFAULT_LADDER: EnvelopeThreshold[] = [75, 90, 100];

/**
 * A budget's own `warn_threshold` replaces the ladder: one heads-up at that
 * percentage, then the unavoidable one at 100%.
 */
export function resolveAlertLadder(
  warnThreshold: number | null | undefined
): EnvelopeThreshold[] {
  if (warnThreshold == null) return DEFAULT_LADDER;
  const clamped = Math.min(Math.max(Math.round(warnThreshold), 1), 99);
  return [clamped, 100];
}

function highestThreshold(
  percentUsed: number,
  ladder: EnvelopeThreshold[]
): EnvelopeThreshold | null {
  let hit: EnvelopeThreshold | null = null;
  for (const step of ladder) {
    if (percentUsed >= step && (hit == null || step > hit)) hit = step;
  }
  return hit;
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
    const threshold = highestThreshold(
      percentUsed,
      resolveAlertLadder(budget.warn_threshold)
    );
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
