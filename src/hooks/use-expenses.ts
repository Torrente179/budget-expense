"use client";

import { useCallback, useEffect, useState } from "react";
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

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });

      if (categoryId) {
        params.set("categoryId", categoryId);
      }

      const trimmedSearch = search?.trim();
      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      const response = await fetch(`/api/expenses?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Expense fetch failed with status ${response.status}`);
      }

      const result = await response.json();
      setExpenses((result.expenses ?? []) as Expense[]);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [month, year, categoryId, search]);

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
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    });

    if (response.ok) {
      await fetchExpenses();
      return null;
    }

    return new Error(`Expense create failed with status ${response.status}`);
  }

  async function updateExpense(
    id: string,
    updates: Database["public"]["Tables"]["expenses"]["Update"]
  ) {
    const response = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      await fetchExpenses();
      return null;
    }

    return new Error(`Expense update failed with status ${response.status}`);
  }

  async function deleteExpense(id: string) {
    const response = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await fetchExpenses();
      return null;
    }

    return new Error(`Expense delete failed with status ${response.status}`);
  }

  return { expenses, loading, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses };
}
