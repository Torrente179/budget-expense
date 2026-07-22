"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";
import type { Database } from "@/types/database";

type MonthlyBudgetPlan =
  Database["public"]["Tables"]["monthly_budget_plans"]["Row"];

export function useMonthlyBudgetPlan({ month, year }: { month: number; year: number }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.monthlyPlan(month, year),
    queryFn: async ({ signal }): Promise<MonthlyBudgetPlan | null> => {
      const request = supabase
        .from("monthly_budget_plans")
        .select("*")
        .eq("month", month)
        .eq("year", year);
      request.abortSignal(signal);
      const { data, error } = await request.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyPlan(month, year) }),
      queryClient.invalidateQueries({ queryKey: ["month-snapshot", year, month] }),
    ]);
  }

  async function upsertPlan(
    values: Omit<
      Database["public"]["Tables"]["monthly_budget_plans"]["Insert"],
      "user_id"
    >
  ) {
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims.sub) return claimsError;
    const { error } = await supabase.from("monthly_budget_plans").upsert(
      { ...values, user_id: claims.claims.sub },
      { onConflict: "user_id,month,year" }
    );
    if (!error) void refresh();
    return error;
  }

  async function deletePlan(id: string) {
    const { error } = await supabase.from("monthly_budget_plans").delete().eq("id", id);
    if (!error) void refresh();
    return error;
  }

  async function copyPlanFromPreviousMonth() {
    if (query.data) return false;
    const previous = month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year };
    const { data: previousPlan } = await supabase
      .from("monthly_budget_plans")
      .select("*")
      .eq("month", previous.month)
      .eq("year", previous.year)
      .maybeSingle();
    if (!previousPlan) return false;
    const error = await upsertPlan({
      income_amount: previousPlan.income_amount,
      income_currency: previousPlan.income_currency,
      allocation_percent: previousPlan.allocation_percent,
      month,
      year,
    });
    return !error;
  }

  return {
    plan: query.data ?? null,
    loading: query.isPending,
    upsertPlan,
    deletePlan,
    copyPlanFromPreviousMonth,
    refetch: query.refetch,
  };
}
