"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  resolveOptionalTableResult,
} from "@/lib/supabase/postgrest-errors";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type CustomBudget =
  Database["public"]["Tables"]["custom_budgets"]["Row"] & {
    custom_budget_categories: Array<{
      id: string;
      category_id: string;
      categories: CategoryRow;
    }>;
  };

interface UseCustomBudgetsOptions {
  month: number;
  year: number;
}

export function useCustomBudgets({ month, year }: UseCustomBudgetsOptions) {
  const [customBudgets, setCustomBudgets] = useState<CustomBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCustomBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("custom_budgets")
        .select("*, custom_budget_categories(*, categories(*))")
        .eq("month", month)
        .eq("year", year)
        .order("created_at");

      const data = resolveOptionalTableResult(result, {
        table: "custom_budgets",
        context: "useCustomBudgets.fetch",
        fallback: [] as CustomBudget[],
      });

      setCustomBudgets(data as CustomBudget[]);
    } catch {
      setCustomBudgets([]);
    }
    setLoading(false);
  }, [supabase, month, year]);

  useEffect(() => {
    fetchCustomBudgets();
  }, [fetchCustomBudgets]);

  async function addCustomBudget(values: {
    name: string;
    amount_type: string;
    amount_value: number;
    currency: string;
    category_ids: string[];
    month: number;
    year: number;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: inserted, error } = await supabase
      .from("custom_budgets")
      .upsert(
        {
          user_id: userData.user.id,
          name: values.name,
          amount_type: values.amount_type,
          amount_value: values.amount_value,
          currency: values.currency,
          month: values.month,
          year: values.year,
        },
        { onConflict: "user_id,name,month,year" }
      )
      .select("id")
      .single();

    if (error || !inserted) return error;

    // Replace junction rows
    await supabase
      .from("custom_budget_categories")
      .delete()
      .eq("custom_budget_id", inserted.id);

    const junctionRows = values.category_ids.map((category_id) => ({
      custom_budget_id: inserted.id,
      category_id,
    }));

    const { error: junctionError } = await supabase
      .from("custom_budget_categories")
      .insert(junctionRows);

    if (junctionError) return junctionError;

    await fetchCustomBudgets();
    return null;
  }

  async function updateCustomBudget(
    id: string,
    values: {
      name: string;
      amount_type: string;
      amount_value: number;
      currency: string;
      category_ids: string[];
    }
  ) {
    const { error } = await supabase
      .from("custom_budgets")
      .update({
        name: values.name,
        amount_type: values.amount_type,
        amount_value: values.amount_value,
        currency: values.currency,
      })
      .eq("id", id);

    if (error) return error;

    // Replace junction rows
    await supabase
      .from("custom_budget_categories")
      .delete()
      .eq("custom_budget_id", id);

    const junctionRows = values.category_ids.map((category_id) => ({
      custom_budget_id: id,
      category_id,
    }));

    const { error: junctionError } = await supabase
      .from("custom_budget_categories")
      .insert(junctionRows);

    if (junctionError) return junctionError;

    await fetchCustomBudgets();
    return null;
  }

  async function deleteCustomBudget(id: string) {
    const { error } = await supabase
      .from("custom_budgets")
      .delete()
      .eq("id", id);
    if (!error) await fetchCustomBudgets();
    return error;
  }

  async function copyFromPreviousMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const { data: prevBudgets } = await supabase
      .from("custom_budgets")
      .select("*, custom_budget_categories(*, categories(*))")
      .eq("month", prevMonth)
      .eq("year", prevYear);

    if (!prevBudgets || prevBudgets.length === 0) return 0;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    let copied = 0;
    for (const budget of prevBudgets as CustomBudget[]) {
      const { data: inserted, error } = await supabase
        .from("custom_budgets")
        .upsert(
          {
            user_id: userData.user.id,
            name: budget.name,
            amount_type: budget.amount_type,
            amount_value: budget.amount_value,
            currency: budget.currency,
            month,
            year,
          },
          { onConflict: "user_id,name,month,year" }
        )
        .select("id")
        .single();

      if (error || !inserted) continue;

      // Clear existing junction rows (in case of upsert match)
      await supabase
        .from("custom_budget_categories")
        .delete()
        .eq("custom_budget_id", inserted.id);

      const junctionRows = budget.custom_budget_categories.map((c) => ({
        custom_budget_id: inserted.id,
        category_id: c.category_id,
      }));

      if (junctionRows.length > 0) {
        await supabase.from("custom_budget_categories").insert(junctionRows);
      }

      copied++;
    }

    await fetchCustomBudgets();
    return copied;
  }

  return {
    customBudgets,
    loading,
    addCustomBudget,
    updateCustomBudget,
    deleteCustomBudget,
    copyFromPreviousMonth,
    refetch: fetchCustomBudgets,
  };
}
