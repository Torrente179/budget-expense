"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
import type { Database } from "@/types/database";

type RecurringExpense = Database["public"]["Tables"]["recurring_expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

export function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
