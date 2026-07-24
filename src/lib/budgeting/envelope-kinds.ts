/**
 * Dual budget engines:
 * - spending_limit — ceiling; 100%+ is exceeded (coral)
 * - contribution_goal — floor; 100% is success (green)
 */

export const BUDGET_KINDS = ["spending_limit", "contribution_goal"] as const;
export type BudgetKind = (typeof BUDGET_KINDS)[number];

export type SpendingLimitStatus = "available" | "near" | "exceeded";
export type ContributionGoalStatus = "empty" | "progress" | "complete";

const GOAL_CLASSIFICATIONS = new Set(["giving", "savings"]);
const GOAL_ROLES = new Set([
  "tithe",
  "donations",
  "savings",
  "investments",
]);

const GOAL_SLICE_KEYS = new Set([
  "tithe",
  "blessing",
  "giving",
  "generosity",
  "savings",
  "saving",
  "growth",
  "future",
  "investing",
  "savings-investing",
]);

export function isBudgetKind(value: unknown): value is BudgetKind {
  return (
    value === "spending_limit" || value === "contribution_goal"
  );
}

export function normalizeBudgetKind(value: unknown): BudgetKind {
  return isBudgetKind(value) ? value : "spending_limit";
}

/** Infer kind from linked category classifications / budget_roles. */
export function inferBudgetKindFromCategories(
  categories: Array<{
    classification?: string | null;
    budget_role?: string | null;
  }>
): BudgetKind {
  if (categories.length === 0) return "spending_limit";
  const allGoals = categories.every((category) => {
    const classification = category.classification ?? "";
    const role = category.budget_role ?? "";
    return GOAL_CLASSIFICATIONS.has(classification) || GOAL_ROLES.has(role);
  });
  return allGoals ? "contribution_goal" : "spending_limit";
}

export function inferBudgetKindFromSliceKey(sliceKey: string): BudgetKind {
  return GOAL_SLICE_KEYS.has(sliceKey)
    ? "contribution_goal"
    : "spending_limit";
}

export function resolveSpendingLimitStatus(
  progress: number
): SpendingLimitStatus {
  if (!Number.isFinite(progress) || progress >= 1) return "exceeded";
  if (progress >= 0.8) return "near";
  return "available";
}

export function resolveContributionGoalStatus(
  contributed: number,
  target: number
): ContributionGoalStatus {
  if (target <= 0) return "empty";
  if (contributed <= 0) return "empty";
  if (contributed >= target) return "complete";
  return "progress";
}

export function spendingLimitStatusLabel(
  status: SpendingLimitStatus,
  locale: "en" | "es"
): string {
  if (locale === "es") {
    if (status === "exceeded") return "Excedido";
    if (status === "near") return "Cerca del límite";
    return "Disponible";
  }
  if (status === "exceeded") return "Exceeded";
  if (status === "near") return "Near limit";
  return "Available";
}

export function contributionGoalStatusLabel(
  status: ContributionGoalStatus,
  progress: number,
  locale: "en" | "es"
): string {
  if (locale === "es") {
    if (status === "empty") return "Sin aportes";
    if (status === "complete") return "Meta completada";
    return `${Math.round(progress * 100)}% completado`;
  }
  if (status === "empty") return "No contributions";
  if (status === "complete") return "Goal complete";
  return `${Math.round(progress * 100)}% complete`;
}

/** Hex for limit bars (mockup: coral / amber / blue). */
export function spendingLimitBarColor(status: SpendingLimitStatus): string {
  if (status === "exceeded") return "#EF4444";
  if (status === "near") return "#F59E0B";
  return "#3B82F6";
}

/** Hex for goal bars (gray / indigo / green). */
export function contributionGoalBarColor(
  status: ContributionGoalStatus
): string {
  if (status === "empty") return "#94A3B8";
  if (status === "complete") return "#22C55E";
  return "#6366F1";
}
