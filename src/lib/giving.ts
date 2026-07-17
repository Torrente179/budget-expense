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
