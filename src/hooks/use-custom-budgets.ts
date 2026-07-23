"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCustomBudgets } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";
import type { Database, Json } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type CustomBudget =
  Database["public"]["Tables"]["custom_budgets"]["Row"] & {
    custom_budget_categories: Array<{
      id: string;
      category_id: string;
      categories: CategoryRow;
    }>;
  };

type BudgetInput = {
  name: string;
  amount_type: string;
  amount_value: number;
  currency: string;
  category_ids: string[];
};

async function authenticatedUserId() {
  const { data, error } = await createClient().auth.getClaims();
  if (error || !data?.claims.sub) throw error ?? new Error("Not signed in");
  return data.claims.sub;
}

function isMissingRpc(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    error?.message?.toLowerCase().includes("could not find the function")
  );
}

export function useCustomBudgets({ month, year }: { month: number; year: number }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.customBudgets(month, year),
    queryFn: ({ signal }) => getCustomBudgets(month, year, signal),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.customBudgets(month, year),
      }),
      queryClient.invalidateQueries({
        queryKey: ["month-snapshot", year, month],
      }),
    ]);
  }

  async function replaceCategories(budgetId: string, categoryIds: string[]) {
    const { error: deleteError } = await supabase
      .from("custom_budget_categories")
      .delete()
      .eq("custom_budget_id", budgetId);
    if (deleteError) return deleteError;
    if (categoryIds.length === 0) return null;
    const { error } = await supabase.from("custom_budget_categories").insert(
      categoryIds.map((category_id) => ({
        custom_budget_id: budgetId,
        category_id,
      }))
    );
    return error;
  }

  async function addCustomBudget(values: BudgetInput & { month: number; year: number }) {
    const userId = await authenticatedUserId();
    const { category_ids, ...budget } = values;
    const { data, error } = await supabase
      .from("custom_budgets")
      .upsert(
        { ...budget, user_id: userId },
        { onConflict: "user_id,name,month,year" }
      )
      .select("id")
      .single();
    if (error || !data) return error;
    const categoryError = await replaceCategories(data.id, category_ids);
    if (!categoryError) void refresh();
    return categoryError;
  }

  async function updateCustomBudget(id: string, values: BudgetInput) {
    const { category_ids, ...budget } = values;
    const { error } = await supabase.from("custom_budgets").update(budget).eq("id", id);
    if (error) return error;
    const categoryError = await replaceCategories(id, category_ids);
    if (!categoryError) void refresh();
    return categoryError;
  }

  async function deleteCustomBudget(id: string) {
    const { error } = await supabase.from("custom_budgets").delete().eq("id", id);
    if (!error) void refresh();
    return error;
  }

  async function seedBudgetsClient(
    budgets: BudgetInput[],
    options?: { replaceExisting?: boolean }
  ) {
    if (options?.replaceExisting) {
      const { error } = await supabase
        .from("custom_budgets")
        .delete()
        .eq("month", month)
        .eq("year", year);
      if (error) return { error, count: 0 };
    }
    let count = 0;
    for (const budget of budgets) {
      const error = await addCustomBudget({ ...budget, month, year });
      if (error) return { error, count };
      count += 1;
    }
    return { error: null, count };
  }

  async function seedBudgets(
    budgets: BudgetInput[],
    options?: { replaceExisting?: boolean }
  ) {
    const result = await supabase.rpc("replace_custom_budget_set", {
      p_year: year,
      p_month: month,
      p_budgets: budgets as unknown as Json,
      p_replace_existing: options?.replaceExisting ?? false,
    });
    if (!result.error) {
      void refresh();
      return { error: null, count: Number(result.data ?? 0) };
    }

    /* Missing RPC, or broken category_ids cast in older SQL — use client path. */
    if (!isMissingRpc(result.error)) {
      console.warn("replace_custom_budget_set failed; falling back", result.error);
    }
    return seedBudgetsClient(budgets, options);
  }

  async function copyFromPreviousMonth() {
    const result = await supabase.rpc("copy_custom_budgets_from_previous_month", {
      p_year: year,
      p_month: month,
    });
    if (!result.error) {
      void refresh();
      return Number(result.data ?? 0);
    }
    if (!isMissingRpc(result.error)) return 0;

    const previous = month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year };
    const rows = await getCustomBudgets(previous.month, previous.year);
    if (rows.length === 0) return 0;
    const seeded = await seedBudgets(
      rows.map((budget) => ({
        name: budget.name,
        amount_type: budget.amount_type,
        amount_value: Number(budget.amount_value),
        currency: budget.currency,
        category_ids: budget.custom_budget_categories.map(
          (category) => category.category_id
        ),
      }))
    );
    return seeded.count;
  }

  return {
    customBudgets: (query.data ?? []) as CustomBudget[],
    loading: query.isPending,
    addCustomBudget,
    updateCustomBudget,
    deleteCustomBudget,
    seedBudgets,
    copyFromPreviousMonth,
    refetch: query.refetch,
  };
}
