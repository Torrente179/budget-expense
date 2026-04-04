"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMonthDateRange,
  syncRecurringExpensesForMonth,
} from "@/lib/recurring-expenses";
import type { Database } from "@/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface UseExpensesOptions {
  month: number;
  year: number;
  categoryId?: string;
  search?: string;
}

export function useExpenses({ month, year, categoryId, search }: UseExpensesOptions) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthDateRange(month, year);

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        try {
          await syncRecurringExpensesForMonth({
            supabase,
            userId: userData.user.id,
            month,
            year,
          });
        } catch (error) {
          console.error("Failed to sync recurring expenses before loading expenses", error);
        }
      }

      let query = supabase
        .from("expenses")
        .select("*, categories(*)")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (search) {
        query = query.ilike("description", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setExpenses((data ?? []) as Expense[]);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, month, year, categoryId, search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function addExpense(expense: {
    amount: number;
    currency: string;
    category_id: string;
    date: string;
    description?: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("expenses").insert({
      ...expense,
      user_id: userData.user.id,
    });

    if (!error) await fetchExpenses();
    return error;
  }

  async function updateExpense(
    id: string,
    updates: Database["public"]["Tables"]["expenses"]["Update"]
  ) {
    const { error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id);

    if (!error) await fetchExpenses();
    return error;
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) await fetchExpenses();
    return error;
  }

  return { expenses, loading, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses };
}
