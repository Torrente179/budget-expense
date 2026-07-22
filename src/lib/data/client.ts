import { createClient } from "@/lib/supabase/client";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import type { Database } from "@/types/database";
import type {
  AppBootstrap,
  HouseholdInsightsPayload,
  MonthSnapshot,
} from "@/lib/data/contracts";
import type { RawSummaryData } from "@/lib/query/fetchers";
import type { EnvelopeWriteContext } from "@/lib/budgeting/notify-envelope-limits";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type IncomeRow = Database["public"]["Tables"]["income_entries"]["Row"];
type ExpenseWithCategory = ExpenseRow & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

export interface CreateExpenseResult {
  expense: ExpenseWithCategory;
  envelopeContext: EnvelopeWriteContext | null;
}

async function getAuthenticatedUserId() {
  const { data, error } = await createClient().auth.getClaims();
  if (error || !data?.claims.sub) {
    throw error ?? new Error("Not signed in");
  }
  return data.claims.sub;
}

const forceLegacyApi =
  process.env.NEXT_PUBLIC_USE_LEGACY_DATA_API === "true";

function isMissingRpc(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    message.includes("could not find the function") ||
    message.includes("does not exist")
  );
}

function monthRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    startDate,
    endDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

export async function getAppBootstrap(signal?: AbortSignal) {
  const supabase = createClient();
  const query = supabase.rpc("get_app_bootstrap");
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (!error && data) return data as unknown as AppBootstrap;
  if (!isMissingRpc(error)) throw error;

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims.sub) throw claimsError ?? new Error("Unauthenticated");
  const userId = claimsData.claims.sub;
  const [profileResult, reviewResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("needs_review", true),
  ]);
  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data;
  return {
    identity: {
      id: userId,
      email:
        typeof claimsData.claims.email === "string"
          ? claimsData.claims.email
          : null,
    },
    profile: {
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      baseCurrency: profile?.base_currency ?? "EUR",
      manualFxRates: profile?.manual_fx_rates ?? {},
      titheTargetPercent: Number(profile?.tithe_target_percent ?? 10),
      onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
      onboardingSkippedAt: profile?.onboarding_skipped_at ?? null,
      wantsBudgetHelp: profile?.wants_budget_help ?? null,
      primaryGoals: profile?.primary_goals ?? [],
      createdAt: profile?.created_at ?? null,
    },
    reviewCount: reviewResult.count ?? 0,
  };
}

export async function getMonthSnapshot(input: {
  month: number;
  year: number;
  asOfDate: string;
  signal?: AbortSignal;
}): Promise<MonthSnapshot> {
  if (forceLegacyApi) return getLegacyMonthSnapshot(input);

  const supabase = createClient();
  const query = supabase.rpc("prepare_month_snapshot", {
    p_year: input.year,
    p_month: input.month,
    p_as_of: input.asOfDate,
  });
  if (input.signal) query.abortSignal(input.signal);
  const { data, error } = await query;

  if (!error && data) return data as unknown as MonthSnapshot;
  if (!isMissingRpc(error)) throw error;
  return getLegacyMonthSnapshot(input);
}

async function getLegacyMonthSnapshot(input: {
  month: number;
  year: number;
  asOfDate: string;
  signal?: AbortSignal;
}): Promise<MonthSnapshot> {
  const params = new URLSearchParams({
    month: String(input.month),
    year: String(input.year),
    asOf: input.asOfDate,
  });
  const [raw, customBudgets, recurringExpenses] = await Promise.all([
    authorizedFetch<RawSummaryData>(`/api/dashboard/summary?${params}`, {
      signal: input.signal,
    }),
    getCustomBudgets(input.month, input.year, input.signal),
    getRecurringExpenses(input.signal),
  ]);

  const totals = new Map<string, MonthSnapshot["currencyTotals"][number]>();
  const totalFor = (currency: string) => {
    const normalized = currency.toUpperCase();
    const existing = totals.get(normalized);
    if (existing) return existing;
    const created = {
      currency: normalized,
      totalSpent: 0,
      totalIncome: 0,
      totalInvestmentTransfers: 0,
      previousSpent: 0,
      previousInvestmentTransfers: 0,
      givingSpent: 0,
      monthToDateSpent: 0,
      monthToDateIncome: 0,
      monthToDateInvestmentTransfers: 0,
    };
    totals.set(normalized, created);
    return created;
  };
  for (const row of raw.expenses ?? []) totalFor(row.currency).totalSpent += Number(row.amount);
  for (const row of raw.incomes ?? []) totalFor(row.currency).totalIncome += Number(row.amount);
  for (const row of raw.investmentTransfers ?? []) totalFor(row.currency).totalInvestmentTransfers += Number(row.amount);
  for (const row of raw.prevExpenses ?? []) totalFor(row.currency).previousSpent += Number(row.amount);
  for (const row of raw.prevInvestmentTransfers ?? []) totalFor(row.currency).previousInvestmentTransfers += Number(row.amount);
  for (const row of raw.monthToDateMovementTotals?.expenses ?? []) {
    totalFor(row.currency).monthToDateSpent += Number(row.amount);
  }
  for (const row of raw.monthToDateMovementTotals?.incomes ?? []) {
    totalFor(row.currency).monthToDateIncome += Number(row.amount);
  }
  for (const row of raw.monthToDateMovementTotals?.investmentTransfers ?? []) {
    totalFor(row.currency).monthToDateInvestmentTransfers += Number(row.amount);
  }

  const categoryMap = new Map<string, MonthSnapshot["categoryAggregates"][number]>();
  const dailyMap = new Map<string, number>();
  for (const expense of raw.expenses ?? []) {
    const category = expense.categories;
    if (category) {
      const key = `${category.id}|${expense.currency}`;
      const current = categoryMap.get(key);
      if (current) {
        current.totalAmount += Number(expense.amount);
        current.expenseCount += 1;
      } else {
        categoryMap.set(key, {
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          classification: category.classification ?? null,
          currency: expense.currency,
          totalAmount: Number(expense.amount),
          expenseCount: 1,
        });
      }
      if (category.classification === "giving") {
        totalFor(expense.currency).givingSpent += Number(expense.amount);
      }
    }
    const key = `${expense.date}|${expense.currency}`;
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(expense.amount));
  }
  for (const transfer of raw.investmentTransfers ?? []) {
    const key = `${transfer.transfer_date}|${transfer.currency}`;
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(transfer.amount));
  }

  const { startDate, endDate } = monthRange(input.month, input.year);
  return {
    period: {
      month: input.month,
      year: input.year,
      asOfDate: input.asOfDate,
      startDate,
      endDate,
    },
    recurringInsertedCount: 0,
    expenseCount: raw.expenses?.length ?? 0,
    currencyTotals: [...totals.values()],
    categoryAggregates: [...categoryMap.values()],
    dailyAggregates: [...dailyMap.entries()].map(([key, amount]) => {
      const [date, currency] = key.split("|");
      return { date, currency, amount };
    }),
    recentMovements: [
      ...(raw.expenses ?? []).map((expense) => ({
        id: expense.id,
        kind: "expense" as const,
        title: expense.description || expense.categories?.name || "—",
        subtitle: expense.categories?.name || "—",
        amount: Number(expense.amount),
        currency: expense.currency,
        date: expense.date,
        createdAt: `${expense.date}T00:00:00Z`,
        category: expense.categories
          ? { icon: expense.categories.icon, color: expense.categories.color }
          : null,
        needsReview: Boolean(expense.needs_review),
      })),
      ...(raw.incomes ?? []).map((income) => ({
        id: income.id,
        kind: "income" as const,
        title: income.source,
        subtitle: income.description || "Income",
        amount: Number(income.amount),
        currency: income.currency,
        date: income.date,
        createdAt: `${income.date}T00:00:00Z`,
        category: null,
        needsReview: false,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12),
    budgets: (raw.budgets ?? []).map((budget, index) => ({
      id: `legacy-${index}`,
      categoryId: "",
      amount: Number(budget.amount),
      currency: budget.currency,
    })),
    monthlyPlan: raw.monthlyPlan
      ? {
          id: "legacy-plan",
          incomeAmount: Number(raw.monthlyPlan.income_amount),
          incomeCurrency: raw.monthlyPlan.income_currency,
          allocationPercent: Number(raw.monthlyPlan.allocation_percent),
        }
      : null,
    customBudgets,
    recurringExpenses,
    balance: {
      status: raw.balanceTrackingStatus ?? "unavailable",
      asOfDate: raw.balanceAsOfDate ?? null,
      checkpoint: raw.balanceCheckpoint ?? null,
      movementTotals: raw.balanceMovementTotals ?? {
        incomes: [],
        expenses: [],
        investmentTransfers: [],
      },
    },
  };
}

export async function getHouseholdInsights(signal?: AbortSignal) {
  if (!forceLegacyApi) {
    const supabase = createClient();
    const query = supabase.rpc("get_household_insights");
    if (signal) query.abortSignal(signal);
    const { data, error } = await query;
    if (!error && data) return data as unknown as HouseholdInsightsPayload;
    if (!isMissingRpc(error)) throw error;
  }
  return authorizedFetch<HouseholdInsightsPayload>("/api/insights/household", {
    signal,
  });
}

export async function getExpenses(input: {
  month: number;
  year: number;
  categoryId?: string;
  search?: string;
  signal?: AbortSignal;
}) {
  const { startDate, endDate } = monthRange(input.month, input.year);
  const supabase = createClient();
  let query = supabase
    .from("expenses")
    .select("*, categories(*)")
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });
  if (input.categoryId) query = query.eq("category_id", input.categoryId);
  if (input.signal) query.abortSignal(input.signal);
  const { data, error } = await query;
  if (error) throw error;
  const search = input.search?.trim().toLocaleLowerCase();
  const rows = (data ?? []) as ExpenseWithCategory[];
  return search
    ? rows.filter((row) =>
        [row.description, row.categories?.name]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(search))
      )
    : rows;
}

export async function getIncomes(input: {
  month: number;
  year: number;
  search?: string;
  signal?: AbortSignal;
}) {
  const { startDate, endDate } = monthRange(input.month, input.year);
  const supabase = createClient();
  const query = supabase
    .from("income_entries")
    .select("*")
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });
  if (input.signal) query.abortSignal(input.signal);
  const { data, error } = await query;
  if (error) throw error;
  const search = input.search?.trim().toLocaleLowerCase();
  const rows = (data ?? []) as IncomeRow[];
  return search
    ? rows.filter((row) =>
        [row.source, row.description]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(search))
      )
    : rows;
}

export async function getCustomBudgets(
  month: number,
  year: number,
  signal?: AbortSignal
) {
  const supabase = createClient();
  const query = supabase
    .from("custom_budgets")
    .select("*, custom_budget_categories(*, categories(*))")
    .eq("month", month)
    .eq("year", year)
    .order("created_at");
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MonthSnapshot["customBudgets"];
}

export async function getRecurringExpenses(signal?: AbortSignal) {
  const supabase = createClient();
  const query = supabase
    .from("recurring_expenses")
    .select("*, categories(*)")
    .eq("is_active", true)
    .order("charge_day");
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MonthSnapshot["recurringExpenses"];
}

export async function createExpense(
  values: Omit<Database["public"]["Tables"]["expenses"]["Insert"], "user_id">
): Promise<CreateExpenseResult> {
  if (forceLegacyApi) {
    const result = await authorizedFetch<{ expense: ExpenseWithCategory }>(
      "/api/expenses",
      { method: "POST", body: JSON.stringify(values) }
    );
    return { expense: result.expense, envelopeContext: null };
  }

  const supabase = createClient();
  const rpcResult = await supabase.rpc("create_expense_with_envelope_status", {
    p_category_id: values.category_id,
    p_amount: values.amount,
    p_currency: values.currency ?? "EUR",
    p_date: values.date ?? new Date().toISOString().slice(0, 10),
    p_description: values.description ?? null,
  });
  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data as unknown as CreateExpenseResult;
  }
  if (!isMissingRpc(rpcResult.error)) throw rpcResult.error;

  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...values, user_id: userId })
    .select("*, categories(*)")
    .single();
  if (error) throw error;
  return { expense: data as ExpenseWithCategory, envelopeContext: null };
}

export async function updateExpense(
  id: string,
  values: Database["public"]["Tables"]["expenses"]["Update"]
) {
  if (forceLegacyApi) {
    await authorizedFetch(`/api/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return;
  }
  const { error } = await createClient().from("expenses").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  if (forceLegacyApi) {
    await authorizedFetch(`/api/expenses/${id}`, { method: "DELETE" });
    return;
  }
  const { error } = await createClient().from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function createIncome(
  values: Omit<Database["public"]["Tables"]["income_entries"]["Insert"], "user_id">
) {
  if (forceLegacyApi) {
    const result = await authorizedFetch<{ income: IncomeRow }>("/api/incomes", {
      method: "POST",
      body: JSON.stringify(values),
    });
    return result.income;
  }
  const userId = await getAuthenticatedUserId();
  const { data, error } = await createClient()
    .from("income_entries")
    .insert({ ...values, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncome(
  id: string,
  values: Database["public"]["Tables"]["income_entries"]["Update"]
) {
  if (forceLegacyApi) {
    await authorizedFetch(`/api/incomes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return;
  }
  const { error } = await createClient()
    .from("income_entries")
    .update(values)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteIncome(id: string) {
  if (forceLegacyApi) {
    await authorizedFetch(`/api/incomes/${id}`, { method: "DELETE" });
    return;
  }
  const { error } = await createClient().from("income_entries").delete().eq("id", id);
  if (error) throw error;
}
