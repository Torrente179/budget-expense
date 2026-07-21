import type { BudgetingMethod } from "@/lib/budgeting-methods";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type Classification = NonNullable<CategoryRow["classification"]>;

/** Slice keys whose money stays on the Generosidad / Primicias card. */
const SKIP_SLICE_KEYS = new Set([
  "tithe",
  "blessing",
  "giving",
  "generosity",
]);

const SLICE_CLASSIFICATIONS: Record<string, Classification[]> = {
  needs: ["essential"],
  essentials: ["essential"],
  necessities: ["essential"],
  housing: ["essential"],
  wants: ["discretionary"],
  flexible: ["discretionary"],
  lifestyle: ["discretionary"],
  spending: ["essential", "discretionary"],
  living: ["essential", "discretionary"],
  "core-values": ["essential", "discretionary"],
  savings: ["savings"],
  growth: ["savings"],
  investing: ["savings"],
  saving: ["savings"],
  "savings-investing": ["savings"],
  future: ["savings"],
  debt: ["essential"],
};

export interface MethodBudgetSeed {
  name: string;
  amount_type: "percentage";
  amount_value: number;
  category_ids: string[];
  sliceKey: string;
}

/**
 * Turn a budgeting method into concrete custom-budget rows: % of income
 * per slice, categories matched by classification. Giving/tithe slices are
 * omitted — Generosidad stays on its own Primicias card.
 */
export function buildMethodBudgetSeeds(
  method: BudgetingMethod,
  categories: Pick<CategoryRow, "id" | "classification" | "name">[]
): MethodBudgetSeed[] {
  const assigned = new Set<string>();
  const seeds: MethodBudgetSeed[] = [];

  for (const slice of method.slices) {
    if (SKIP_SLICE_KEYS.has(slice.key)) continue;

    const hints = SLICE_CLASSIFICATIONS[slice.key] ?? ["discretionary"];
    const matched = categories.filter((category) => {
      if (assigned.has(category.id)) return false;
      const classification = category.classification ?? "discretionary";
      return hints.includes(classification);
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

  // Leftover categories → largest discretionary-ish seed so nothing is orphaned.
  const leftovers = categories.filter((category) => !assigned.has(category.id));
  if (leftovers.length > 0 && seeds.length > 0) {
    const preferred =
      seeds.find((seed) =>
        ["wants", "flexible", "lifestyle", "spending", "living"].includes(
          seed.sliceKey
        )
      ) ??
      [...seeds].sort((a, b) => b.amount_value - a.amount_value)[0];

    preferred.category_ids = [
      ...preferred.category_ids,
      ...leftovers.map((category) => category.id),
    ];
  }

  // Drop empty seeds only if another seed absorbed categories; keep % buckets
  // even with zero categories so the plan structure stays visible.
  return seeds;
}

export function methodAllocationPercent(method: BudgetingMethod): number {
  return method.slices.reduce((sum, slice) => sum + slice.percent, 0);
}
