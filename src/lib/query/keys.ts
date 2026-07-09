/**
 * Central query-key factory. Every cached domain builds its keys here so
 * invalidation stays consistent across hooks and (later) optimistic updates.
 */
export const queryKeys = {
  expenses: (filters: {
    month: number;
    year: number;
    categoryId?: string;
    search?: string;
  }) =>
    [
      "expenses",
      filters.year,
      filters.month,
      filters.categoryId ?? null,
      filters.search?.trim() || null,
    ] as const,
  expensesAll: ["expenses"] as const,

  incomes: (filters: { month: number; year: number; search?: string }) =>
    [
      "incomes",
      filters.year,
      filters.month,
      filters.search?.trim() || null,
    ] as const,
  incomesAll: ["incomes"] as const,

  categories: ["categories"] as const,

  monthlySummary: (month: number, year: number) =>
    ["monthly-summary", year, month] as const,
  monthlySummaryAll: ["monthly-summary"] as const,
} as const;
