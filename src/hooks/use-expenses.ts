"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { fetchExpenses } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { Database } from "@/types/database";

interface UseExpensesOptions {
  month: number;
  year: number;
  categoryId?: string;
  search?: string;
}

export function useExpenses({
  month,
  year,
  categoryId,
  search,
}: UseExpensesOptions) {
  const queryClient = useQueryClient();

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.expenses({ month, year, categoryId, search }),
    queryFn: () => fetchExpenses({ month, year, categoryId, search }),
  });

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
    ]);
  }, [queryClient]);

  async function addExpense(expense: {
    amount: number;
    currency: string;
    category_id: string;
    date: string;
    description?: string;
  }) {
    try {
      await authorizedFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
      });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Expense create failed");
    }
  }

  async function updateExpense(
    id: string,
    updates: Database["public"]["Tables"]["expenses"]["Update"]
  ) {
    try {
      await authorizedFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Expense update failed");
    }
  }

  async function deleteExpense(id: string) {
    try {
      await authorizedFetch(`/api/expenses/${id}`, { method: "DELETE" });
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Expense delete failed");
    }
  }

  return {
    expenses: data ?? [],
    loading: isPending,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
}
