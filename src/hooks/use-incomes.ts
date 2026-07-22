"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIncomes } from "@/lib/query/fetchers";
import {
  createIncome,
  deleteIncome as removeIncome,
  updateIncome as patchIncome,
} from "@/lib/data";
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
    queryKey: queryKeys.incomes({ month, year }),
    queryFn: ({ signal }) => fetchIncomes({ month, year }, signal),
  });
  const incomes = useMemo(() => {
    const normalized = search?.trim().toLocaleLowerCase();
    if (!normalized) return data ?? [];
    return (data ?? []).filter((row) =>
      [row.source, row.description]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized))
    );
  }, [data, search]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["incomes", year, month] }),
      queryClient.invalidateQueries({
        queryKey: ["month-snapshot", year, month],
      }),
    ]);
  }, [month, queryClient, year]);

  async function addIncome(income: {
    amount: number;
    currency: string;
    source: string;
    date: string;
    description?: string;
  }) {
    try {
      await createIncome(income);
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
      await patchIncome(id, updates);
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Income update failed");
    }
  }

  async function deleteIncome(id: string) {
    try {
      await removeIncome(id);
      await invalidate();
      return null;
    } catch (error) {
      return error instanceof Error ? error : new Error("Income delete failed");
    }
  }

  return {
    incomes,
    loading: isPending,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch,
  };
}
