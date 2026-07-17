"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
import { syncRecurringMonth } from "@/lib/query/sync-recurring";
import { queryKeys } from "@/lib/query/keys";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";
import type { Database } from "@/types/database";

type RecurringExpense = Database["public"]["Tables"]["recurring_expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

async function refreshRecurringMaterialization(
  queryClient: ReturnType<typeof useQueryClient>
) {
  try {
    await syncRecurringMonth(getCurrentMonth(), getCurrentYear());
    void queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.monthlySummaryAll,
    });
  } catch (error) {
    console.error("Failed to sync recurring after rule write", error);
  }
}

export function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const fetchRecurringExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("recurring_expenses")
        .select("*, categories(*)")
        .order("created_at", { ascending: false });

      const data = resolveOptionalTableResult(result, {
        table: "recurring_expenses",
        context: "Recurring expenses table is unavailable during fetch",
        fallback: [],
      });

      setRecurringExpenses(data as RecurringExpense[]);
    } catch (error) {
      console.error("Failed to fetch recurring expenses", error);
      setRecurringExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  async function addRecurringExpense(expense: {
    amount: number;
    currency: string;
    category_id: string;
    charge_day: number;
    start_date: string;
    description?: string;
    is_active?: boolean;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("recurring_expenses").insert({
      ...expense,
      user_id: userData.user.id,
    });

    if (!error) {
      await fetchRecurringExpenses();
      await refreshRecurringMaterialization(queryClient);
    }

    return error;
  }

  async function updateRecurringExpense(
    id: string,
    updates: Database["public"]["Tables"]["recurring_expenses"]["Update"]
  ) {
    const { error } = await supabase
      .from("recurring_expenses")
      .update(updates)
      .eq("id", id);

    if (!error) {
      await fetchRecurringExpenses();
      await refreshRecurringMaterialization(queryClient);
    }

    return error;
  }

  async function deleteRecurringExpense(id: string) {
    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchRecurringExpenses();
      await refreshRecurringMaterialization(queryClient);
    }

    return error;
  }

  return {
    recurringExpenses,
    loading,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    refetch: fetchRecurringExpenses,
  };
}
