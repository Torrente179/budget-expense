"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Budget = Database["public"]["Tables"]["budgets"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface UseBudgetsOptions {
  month: number;
  year: number;
}

export function useBudgets({ month, year }: UseBudgetsOptions) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("month", month)
      .eq("year", year)
      .order("created_at");

    if (data) setBudgets(data as Budget[]);
    setLoading(false);
  }, [supabase, month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function addBudget(budget: {
    amount: number;
    currency: string;
    category_id: string;
    month: number;
    year: number;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("budgets").upsert(
      {
        ...budget,
        user_id: userData.user.id,
      },
      { onConflict: "user_id,category_id,month,year" }
    );

    if (!error) await fetchBudgets();
    return error;
  }

  async function updateBudget(
    id: string,
    updates: Database["public"]["Tables"]["budgets"]["Update"]
  ) {
    const { error } = await supabase
      .from("budgets")
      .update(updates)
      .eq("id", id);

    if (!error) await fetchBudgets();
    return error;
  }

  async function deleteBudget(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (!error) await fetchBudgets();
    return error;
  }

  async function copyFromPreviousMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const { data: prevBudgets } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", prevMonth)
      .eq("year", prevYear);

    if (prevBudgets && prevBudgets.length > 0) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const newBudgets = prevBudgets.map((b) => ({
        user_id: userData.user!.id,
        category_id: b.category_id,
        amount: b.amount,
        currency: b.currency,
        month,
        year,
      }));

      for (const budget of newBudgets) {
        await supabase.from("budgets").upsert(budget, {
          onConflict: "user_id,category_id,month,year",
        });
      }
      await fetchBudgets();
    }
    return prevBudgets?.length ?? 0;
  }

  return { budgets, loading, addBudget, updateBudget, deleteBudget, copyFromPreviousMonth, refetch: fetchBudgets };
}
