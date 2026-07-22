import type { Database, Json } from "@/types/database";
import type {
  BalanceCheckpointRecord,
  BalanceMovementTotals,
} from "@/lib/balance-checkpoint";

export interface AppBootstrap {
  identity: { id: string; email: string | null };
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    baseCurrency: string;
    manualFxRates: Json;
    titheTargetPercent: number;
    onboardingCompletedAt: string | null;
    onboardingSkippedAt: string | null;
    wantsBudgetHelp: boolean | null;
    primaryGoals: string[];
    createdAt: string | null;
  };
  reviewCount: number;
}

export interface MonthCurrencyTotals {
  currency: string;
  totalSpent: number;
  totalIncome: number;
  totalInvestmentTransfers: number;
  previousSpent: number;
  previousInvestmentTransfers: number;
  givingSpent: number;
  monthToDateSpent: number;
  monthToDateIncome: number;
  monthToDateInvestmentTransfers: number;
}

export interface MonthCategoryAggregate {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  classification: string | null;
  currency: string;
  totalAmount: number;
  expenseCount: number;
}

export interface MonthSnapshot {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
    asOfDate: string;
  };
  recurringInsertedCount: number;
  expenseCount: number;
  currencyTotals: MonthCurrencyTotals[];
  categoryAggregates: MonthCategoryAggregate[];
  dailyAggregates: { date: string; currency: string; amount: number }[];
  recentMovements: {
    id: string;
    kind: "expense" | "income";
    title: string;
    subtitle: string;
    amount: number;
    currency: string;
    date: string;
    createdAt: string;
    category: { icon: string; color: string } | null;
    needsReview: boolean;
  }[];
  budgets: {
    id: string;
    categoryId: string;
    amount: number;
    currency: string;
  }[];
  monthlyPlan: {
    id: string;
    incomeAmount: number;
    incomeCurrency: string;
    allocationPercent: number;
  } | null;
  customBudgets: Array<
    Database["public"]["Tables"]["custom_budgets"]["Row"] & {
      custom_budget_categories: Array<{
        id: string;
        category_id: string;
        categories: Database["public"]["Tables"]["categories"]["Row"];
      }>;
    }
  >;
  recurringExpenses: Array<
    Database["public"]["Tables"]["recurring_expenses"]["Row"] & {
      categories: Database["public"]["Tables"]["categories"]["Row"] | null;
    }
  >;
  balance: {
    status: "tracked" | "untracked" | "future" | "unavailable";
    asOfDate: string | null;
    checkpoint: BalanceCheckpointRecord | null;
    movementTotals: BalanceMovementTotals;
  };
}

export interface HouseholdInsightsPayload {
  startMonth: string;
  expenses: Array<{
    month: string;
    bucket: "giving" | "essential" | "discretionary" | "savings";
    currency: string;
    total: number;
    count: number;
  }>;
  incomes: Array<{ month: string; currency: string; total: number }>;
  categories: Array<{
    month: string;
    categoryId: string;
    categoryName: string;
    currency: string;
    total: number;
    count: number;
  }>;
  liabilities: Array<{
    id: string;
    name: string;
    kind: string;
    currency: string;
    original_balance: number;
    interest_rate_percent: number | null;
    is_active: boolean;
    paid_total: number;
  }>;
  titheTargetPercent: number;
  settingsAvailable: boolean;
}
