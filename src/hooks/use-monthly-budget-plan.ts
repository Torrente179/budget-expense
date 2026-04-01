"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type MonthlyBudgetPlan =
  Database["public"]["Tables"]["monthly_budget_plans"]["Row"];

interface UseMonthlyBudgetPlanOptions {
  month: number;
  year: number;
}

export function useMonthlyBudgetPlan({
  month,
  year,
}: UseMonthlyBudgetPlanOptions) {
  const [plan, setPlan] = useState<MonthlyBudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("monthly_budget_plans")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (!error) {
      setPlan(data);
    }

    setLoading(false);
  }, [supabase, month, year]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  async function upsertPlan(
    values: Omit<
      Database["public"]["Tables"]["monthly_budget_plans"]["Insert"],
      "user_id"
    >
  ) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("monthly_budget_plans").upsert(
      {
        ...values,
        user_id: userData.user.id,
      },
      { onConflict: "user_id,month,year" }
    );

    if (!error) await fetchPlan();
    return error;
  }

  async function deletePlan(id: string) {
    const { error } = await supabase
      .from("monthly_budget_plans")
      .delete()
      .eq("id", id);

    if (!error) await fetchPlan();
    return error;
  }

  return { plan, loading, upsertPlan, deletePlan, refetch: fetchPlan };
}
