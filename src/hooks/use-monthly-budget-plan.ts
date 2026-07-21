"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
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
    try {
      const result = await supabase
        .from("monthly_budget_plans")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      const data = resolveOptionalTableResult(result, {
        table: "monthly_budget_plans",
        context: "Monthly budget plans table is unavailable during fetch",
        fallback: null,
      });

      setPlan(data);
    } catch (error) {
      console.error("Failed to fetch monthly budget plan", error);
      setPlan(null);
    } finally {
      setLoading(false);
    }
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

  /** Copy previous month's plan into this month when this month has none. */
  async function copyPlanFromPreviousMonth() {
    if (plan) return false;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const { data: prevPlan } = await supabase
      .from("monthly_budget_plans")
      .select("*")
      .eq("month", prevMonth)
      .eq("year", prevYear)
      .maybeSingle();

    if (!prevPlan) return false;

    const error = await upsertPlan({
      income_amount: prevPlan.income_amount,
      income_currency: prevPlan.income_currency,
      allocation_percent: prevPlan.allocation_percent,
      month,
      year,
    });

    return !error;
  }

  return {
    plan,
    loading,
    upsertPlan,
    deletePlan,
    copyPlanFromPreviousMonth,
    refetch: fetchPlan,
  };
}
