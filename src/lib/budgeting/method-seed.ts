import type { BudgetingMethod } from "@/lib/budgeting-methods";
import type { BudgetRole } from "@/lib/budgeting/budget-roles";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/** Roles that never seed into spending envelopes. */
const EXCLUDED_ROLES = new Set<BudgetRole>(["income", "loan_lent"]);

/**
 * Slice key → budget roles. Order of slices in the method still matters for
 * first-wins assignment when roles could overlap (they mostly don't).
 */
const SLICE_ROLES: Record<string, BudgetRole[]> = {
  housing: ["housing"],
  needs: [
    "housing",
    "utilities",
    "groceries",
    "transport",
    "healthcare",
    "insurance",
    "taxes",
  ],
  essentials: [
    "housing",
    "utilities",
    "groceries",
    "transport",
    "healthcare",
    "insurance",
    "taxes",
  ],
  necessities: [
    "housing",
    "utilities",
    "groceries",
    "transport",
    "healthcare",
    "insurance",
    "taxes",
  ],
  debt: ["debt_payment"],
  wants: [
    "dining",
    "shopping",
    "subscriptions",
    "entertainment",
    "travel",
    "personal_care",
    "education",
    "professional",
    "cash",
    "other",
  ],
  flexible: [
    "dining",
    "shopping",
    "subscriptions",
    "entertainment",
    "travel",
    "personal_care",
    "education",
    "professional",
    "cash",
    "other",
  ],
  lifestyle: [
    "dining",
    "shopping",
    "subscriptions",
    "entertainment",
    "travel",
    "personal_care",
    "education",
    "professional",
    "cash",
    "other",
  ],
  spending: [
    "housing",
    "utilities",
    "groceries",
    "transport",
    "healthcare",
    "insurance",
    "taxes",
    "dining",
    "shopping",
    "subscriptions",
    "entertainment",
    "travel",
    "personal_care",
    "education",
    "professional",
    "cash",
    "other",
  ],
  living: [
    "housing",
    "utilities",
    "groceries",
    "transport",
    "healthcare",
    "insurance",
    "taxes",
    "dining",
    "shopping",
    "subscriptions",
    "entertainment",
    "travel",
    "personal_care",
    "education",
    "professional",
    "cash",
    "other",
  ],
  "core-values": [
    "tithe",
    "donations",
    "education",
    "healthcare",
    "personal_care",
  ],
  savings: ["savings"],
  saving: ["savings"],
  growth: ["savings"],
  future: ["savings"],
  investing: ["investments", "savings"],
  "savings-investing": ["investments", "savings"],
  tithe: ["tithe"],
  blessing: ["donations"],
  giving: ["donations", "tithe"],
  generosity: ["donations", "tithe"],
};

const LIFESTYLE_SLICE_KEYS = new Set([
  "wants",
  "flexible",
  "lifestyle",
  "spending",
  "living",
]);

export interface MethodBudgetSeed {
  name: string;
  amount_type: "percentage";
  amount_value: number;
  category_ids: string[];
  sliceKey: string;
}

type SeedCategory = Pick<
  CategoryRow,
  "id" | "classification" | "name" | "budget_role" | "applies_to"
>;

function categoryRole(category: SeedCategory): BudgetRole {
  return (category.budget_role ?? "other") as BudgetRole;
}

function isSeedableExpense(category: SeedCategory): boolean {
  if (category.applies_to === "income") return false;
  const role = categoryRole(category);
  if (EXCLUDED_ROLES.has(role)) return false;
  return true;
}

/**
 * Turn a budgeting method into concrete custom-budget rows using each
 * category's budget_role. Giving slices create envelopes. Loan-lent and
 * income categories are excluded.
 */
export function buildMethodBudgetSeeds(
  method: BudgetingMethod,
  categories: SeedCategory[]
): MethodBudgetSeed[] {
  const pool = categories.filter(isSeedableExpense);
  const assigned = new Set<string>();
  const seeds: MethodBudgetSeed[] = [];
  const sliceKeys = new Set(method.slices.map((slice) => slice.key));
  const hasTitheSlice = sliceKeys.has("tithe");

  for (const slice of method.slices) {
    let roles = SLICE_ROLES[slice.key] ?? ["other"];

    // If tithe has its own slice, giving/blessing/generosity keep donations only.
    if (
      hasTitheSlice &&
      (slice.key === "giving" ||
        slice.key === "blessing" ||
        slice.key === "generosity")
    ) {
      roles = ["donations"];
    }

    // After a housing slice, "essentials" must not reclaim housing.
    if (slice.key === "essentials" && sliceKeys.has("housing")) {
      roles = roles.filter((role) => role !== "housing");
    }

    // Investing prefers investments; fall back to savings only if none exist.
    if (slice.key === "investing" || slice.key === "savings-investing") {
      const hasInvestments = pool.some(
        (category) =>
          !assigned.has(category.id) && categoryRole(category) === "investments"
      );
      roles = hasInvestments ? ["investments"] : ["investments", "savings"];
    }

    const matched = pool.filter((category) => {
      if (assigned.has(category.id)) return false;
      return roles.includes(categoryRole(category));
    });

    for (const category of matched) {
      assigned.add(category.id);
    }

    seeds.push({
      name: slice.label,
      amount_type: "percentage",
      amount_value: slice.percent,
      category_ids: matched.map((category) => category.id),
      sliceKey: slice.key,
    });
  }

  const leftovers = pool.filter((category) => !assigned.has(category.id));
  if (leftovers.length > 0 && seeds.length > 0) {
    const preferred =
      seeds.find((seed) => LIFESTYLE_SLICE_KEYS.has(seed.sliceKey)) ??
      [...seeds].sort((a, b) => b.amount_value - a.amount_value)[0];

    preferred.category_ids = [
      ...preferred.category_ids,
      ...leftovers.map((category) => category.id),
    ];
  }

  return seeds;
}
