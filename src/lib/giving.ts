/** Keywords used to detect giving / tithe expenses when classification is unset. */
export const GIVING_KEYWORDS = [
  "tithe",
  "diezmo",
  "giving",
  "donation",
  "donación",
  "donacion",
  "charity",
  "caridad",
  "offering",
  "ofrenda",
  "church",
  "iglesia",
  "generosity",
  "generosidad",
  "tzedakah",
] as const;

export function isGivingName(name: string) {
  const lower = name.toLowerCase();
  return GIVING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function isGivingExpense(expense: {
  description?: string | null;
  categories?: {
    classification?: string | null;
    name?: string | null;
  } | null;
}) {
  const category = expense.categories;
  return (
    category?.classification === "giving" ||
    isGivingName(category?.name ?? "") ||
    (expense.description ? isGivingName(expense.description) : false)
  );
}

/**
 * Giving target is always a share of income — never of expenses.
 * Prefer the monthly plan income (set in onboarding) over recorded movements.
 */
export function resolveGivingTarget(input: {
  tithePercent: number;
  planIncome: number | null | undefined;
  recordedIncome: number | null | undefined;
}): number {
  if (!(input.tithePercent > 0)) return 0;
  const incomeBase =
    input.planIncome != null && input.planIncome > 0
      ? input.planIncome
      : input.recordedIncome != null && input.recordedIncome > 0
        ? input.recordedIncome
        : 0;
  if (!(incomeBase > 0)) return 0;
  return incomeBase * (input.tithePercent / 100);
}
