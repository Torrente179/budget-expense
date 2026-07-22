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

  appBootstrap: ["app-bootstrap"] as const,
  monthSnapshot: (month: number, year: number, asOfDate: string) =>
    ["month-snapshot", year, month, asOfDate] as const,
  monthSnapshotAll: ["month-snapshot"] as const,
  customBudgets: (month: number, year: number) =>
    ["custom-budgets", year, month] as const,
  customBudgetsAll: ["custom-budgets"] as const,
  monthlyPlan: (month: number, year: number) =>
    ["monthly-plan", year, month] as const,
  monthlyPlanAll: ["monthly-plan"] as const,
  recurringExpenses: ["recurring-expenses"] as const,
  householdInsights: ["household-insights"] as const,
  exchangeRates: ["exchange-rates"] as const,
  marketQuotes: (symbols: string[]) =>
    ["market-quotes", [...symbols].sort().join(",")] as const,
  investmentSnapshot: ["investments", "snapshot"] as const,
  investmentOverview: ["investments", "overview"] as const,
  investmentTrades: ["investments", "trades"] as const,
  investmentCash: ["investments", "cash"] as const,
  investmentSavings: ["investments", "savings"] as const,
  investmentWatchlist: ["investments", "watchlist"] as const,
  investmentsAll: ["investments"] as const,

  onboardingProfile: ["onboarding-profile"] as const,
} as const;
