"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getRecurringExpenses } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";
import { getCurrentMonth, getCurrentYear } from "@/lib/calendar";
import type { Database } from "@/types/database";

type RecurringExpense =
  Database["public"]["Tables"]["recurring_expenses"]["Row"] & {
    categories: Database["public"]["Tables"]["categories"]["Row"];
  };

export function useRecurringExpenses() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.recurringExpenses,
    queryFn: ({ signal }) => getRecurringExpenses(signal),
  });

  function refresh() {
    const month = getCurrentMonth();
    const year = getCurrentYear();
    void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses });
    void queryClient.invalidateQueries({
      queryKey: ["month-snapshot", year, month],
    });
  }

  async function addRecurringExpense(expense: {
    amount: number;
    currency: string;
    category_id: string;
    charge_day: number;
    start_date: string;
    description?: string;
    is_active?: boolean;
  }) {
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims.sub) return claimsError;
    const { error } = await supabase.from("recurring_expenses").insert({
      ...expense,
      user_id: claims.claims.sub,
    });
    if (!error) refresh();
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
    if (!error) refresh();
    return error;
  }

  async function deleteRecurringExpense(id: string) {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
    if (!error) refresh();
    return error;
  }

  return {
    recurringExpenses: (query.data ?? []) as RecurringExpense[],
    loading: query.isPending,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    refetch: query.refetch,
  };
}
