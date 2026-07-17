import { authorizedFetch } from "@/lib/query/authorized-fetch";
import type { Database } from "@/types/database";

export type ExpenseWithCategory =
  Database["public"]["Tables"]["expenses"]["Row"] & {
    categories: Database["public"]["Tables"]["categories"]["Row"];
  };

export type IncomeEntry = Database["public"]["Tables"]["income_entries"]["Row"];

export interface ExpenseFilters {
  month: number;
  year: number;
  categoryId?: string;
  search?: string;
}

export interface IncomeFilters {
  month: number;
  year: number;
  search?: string;
}

/** Raw dashboard-summary API payload — currency conversion happens client-side. */
export interface RawSummaryExpense {
  id: string;
  amount: unknown;
  currency: string;
  date: string;
  description: string | null;
  needs_review: boolean;
  category_id: string;
  categories: {
    id: string;
    name: string;
    color: string;
    icon: string;
    classification?: string | null;
  } | null;
}

export interface RawSummaryIncome {
  id: string;
  amount: unknown;
  currency: string;
  date: string;
  source: string;
  description: string | null;
}

export interface RawSummaryData {
  expenses: RawSummaryExpense[];
  incomes: RawSummaryIncome[];
  prevExpenses: { amount: unknown; currency: string }[];
  budgets: { amount: unknown; currency: string }[];
  monthlyPlan: {
    income_amount: unknown;
    income_currency: string;
    allocation_percent: unknown;
  } | null;
  investmentTransfers: {
    amount: unknown;
    currency: string;
    transfer_date: string;
  }[];
  prevInvestmentTransfers: { amount: unknown; currency: string }[];
}

export interface RecentMovement {
  id: string;
  kind: "expense" | "income";
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  date: string;
  category: { icon: string; color: string } | null;
  needsReview: boolean;
}

function monthParams(filters: { month: number; year: number }) {
  return new URLSearchParams({
    month: String(filters.month),
    year: String(filters.year),
  });
}

export async function fetchExpenses(
  filters: ExpenseFilters
): Promise<ExpenseWithCategory[]> {
  const params = monthParams(filters);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  const trimmedSearch = filters.search?.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);

  const result = await authorizedFetch<{ expenses?: ExpenseWithCategory[] }>(
    `/api/expenses?${params.toString()}`
  );
  return result.expenses ?? [];
}

export async function fetchIncomes(
  filters: IncomeFilters
): Promise<IncomeEntry[]> {
  const params = monthParams(filters);
  const trimmedSearch = filters.search?.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);

  const result = await authorizedFetch<{ incomes?: IncomeEntry[] }>(
    `/api/incomes?${params.toString()}`
  );
  return result.incomes ?? [];
}

export async function fetchMonthlySummaryRaw(
  month: number,
  year: number
): Promise<RawSummaryData> {
  const params = monthParams({ month, year });
  const data = await authorizedFetch<Partial<RawSummaryData>>(
    `/api/dashboard/summary?${params.toString()}`
  );

  return {
    expenses: data.expenses ?? [],
    incomes: data.incomes ?? [],
    prevExpenses: data.prevExpenses ?? [],
    budgets: data.budgets ?? [],
    monthlyPlan: data.monthlyPlan ?? null,
    investmentTransfers: data.investmentTransfers ?? [],
    prevInvestmentTransfers: data.prevInvestmentTransfers ?? [],
  };
}
