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
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });

      const trimmedSearch = search?.trim();
      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/incomes?${params.toString()}`, {
        credentials: "include",
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`Income fetch failed with status ${response.status}`);
      }

      const result = await response.json();
      setIncomes((result.incomes ?? []) as Income[]);
    } catch (error) {
      console.error("Failed to fetch incomes", error);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/incomes", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify(income),
    });

    if (response.ok) {
      await fetchIncomes();
      return null;
    }

    return new Error(`Income create failed with status ${response.status}`);
  }

  async function updateIncome(
    id: string,
    updates: Database["public"]["Tables"]["income_entries"]["Update"]
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`/api/incomes/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      await fetchIncomes();
      return null;
    }

    return new Error(`Income update failed with status ${response.status}`);
  }

  async function deleteIncome(id: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`/api/incomes/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: session?.access_token
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : undefined,
    });

    if (response.ok) {
      await fetchIncomes();
      return null;
    }

    return new Error(`Income delete failed with status ${response.status}`);
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
