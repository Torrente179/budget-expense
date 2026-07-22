"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExpenses } from "@/lib/query/fetchers";
import {
  createExpense,
  deleteExpense as removeExpense,
  updateExpense as patchExpense,
} from "@/lib/data";
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
    queryKey: queryKeys.expenses({ month, year, categoryId }),
    queryFn: ({ signal }) =>
      fetchExpenses({ month, year, categoryId }, signal),
  });
  const expenses = useMemo(() => {
    const normalized = search?.trim().toLocaleLowerCase();
    if (!normalized) return data ?? [];
    return (data ?? []).filter((row) =>
      [row.description, row.categories?.name]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized))
    );
  }, [data, search]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses", year, month] }),
      queryClient.invalidateQueries({
        queryKey: ["month-snapshot", year, month],
      }),
    ]);
  }, [month, queryClient, year]);

  async function addExpense(expense: {
    amount: number;
    currency: string;
    category_id: string;
    date: string;
    description?: string;
  }) {
    try {
      await createExpense(expense);
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
      await patchExpense(id, updates);
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
      await removeExpense(id);
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Expense delete failed");
    }
  }

  return {
    expenses,
    loading: isPending,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
}
