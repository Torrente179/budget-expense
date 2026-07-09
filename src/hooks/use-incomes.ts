"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { fetchIncomes } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { Database } from "@/types/database";

interface UseIncomesOptions {
  month: number;
  year: number;
  search?: string;
}

export function useIncomes({ month, year, search }: UseIncomesOptions) {
  const queryClient = useQueryClient();

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.incomes({ month, year, search }),
    queryFn: () => fetchIncomes({ month, year, search }),
  });

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
    ]);
  }, [queryClient]);

  async function addIncome(income: {
    amount: number;
    currency: string;
    source: string;
    date: string;
    description?: string;
  }) {
    try {
      await authorizedFetch("/api/incomes", {
        method: "POST",
        body: JSON.stringify(income),
      });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Income create failed");
    }
  }

  async function updateIncome(
    id: string,
    updates: Database["public"]["Tables"]["income_entries"]["Update"]
  ) {
    try {
      await authorizedFetch(`/api/incomes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Income update failed");
    }
  }

  async function deleteIncome(id: string) {
    try {
      await authorizedFetch(`/api/incomes/${id}`, { method: "DELETE" });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Income delete failed");
    }
  }

  return {
    incomes: data ?? [],
    loading: isPending,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch,
  };
}
