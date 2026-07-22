"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Budget = Database["public"]["Tables"]["budgets"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

export function useBudgets({ month, year }: { month: number; year: number }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["budgets", year, month],
    queryFn: async ({ signal }): Promise<Budget[]> => {
      const request = supabase
        .from("budgets")
        .select("*, categories(*)")
        .eq("month", month)
        .eq("year", year)
        .order("created_at");
      request.abortSignal(signal);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["budgets", year, month] });
    void queryClient.invalidateQueries({ queryKey: ["month-snapshot", year, month] });
  }

  async function addBudget(budget: {
    amount: number;
    currency: string;
    category_id: string;
    month: number;
    year: number;
  }) {
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims.sub) return claimsError;
    const { error } = await supabase.from("budgets").upsert(
      { ...budget, user_id: claims.claims.sub },
      { onConflict: "user_id,category_id,month,year" }
    );
    if (!error) refresh();
    return error;
  }

  async function updateBudget(
    id: string,
    updates: Database["public"]["Tables"]["budgets"]["Update"]
  ) {
    const { error } = await supabase.from("budgets").update(updates).eq("id", id);
    if (!error) refresh();
    return error;
  }

  async function deleteBudget(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (!error) refresh();
    return error;
  }

  async function copyFromPreviousMonth() {
    const { data, error } = await supabase.rpc(
      "copy_category_budgets_from_previous_month",
      { p_year: year, p_month: month }
    );
    if (!error) {
      refresh();
      return Number(data ?? 0);
    }
    const previous = month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year };
    const [{ data: rows }, { data: claims }] = await Promise.all([
      supabase
        .from("budgets")
        .select("category_id, amount, currency")
        .eq("month", previous.month)
        .eq("year", previous.year),
      supabase.auth.getClaims(),
    ]);
    if (!claims?.claims.sub || !rows?.length) return 0;
    const { error: copyError } = await supabase.from("budgets").upsert(
      rows.map((row) => ({
        ...row,
        user_id: claims.claims.sub,
        month,
        year,
      })),
      { onConflict: "user_id,category_id,month,year" }
    );
    if (!copyError) refresh();
    return copyError ? 0 : rows.length;
  }

  return {
    budgets: query.data ?? [],
    loading: query.isPending,
    addBudget,
    updateBudget,
    deleteBudget,
    copyFromPreviousMonth,
    refetch: query.refetch,
  };
}
