"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Income = Database["public"]["Tables"]["income_entries"]["Row"];

interface UseIncomesOptions {
  month: number;
  year: number;
  search?: string;
}

export function useIncomes({ month, year, search }: UseIncomesOptions) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    let query = supabase
      .from("income_entries")
      .select("*")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (search) {
      query = query.or(`source.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data } = await query;
    if (data) {
      setIncomes(data as Income[]);
    }
    setLoading(false);
  }, [month, search, supabase, year]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  async function addIncome(income: {
    amount: number;
    currency: string;
    source: string;
    date: string;
    description?: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("income_entries").insert({
      ...income,
      user_id: userData.user.id,
    });

    if (!error) {
      await fetchIncomes();
    }
    return error;
  }

  async function updateIncome(
    id: string,
    updates: Database["public"]["Tables"]["income_entries"]["Update"]
  ) {
    const { error } = await supabase
      .from("income_entries")
      .update(updates)
      .eq("id", id);

    if (!error) {
      await fetchIncomes();
    }
    return error;
  }

  async function deleteIncome(id: string) {
    const { error } = await supabase.from("income_entries").delete().eq("id", id);
    if (!error) {
      await fetchIncomes();
    }
    return error;
  }

  return {
    incomes,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes,
  };
}
