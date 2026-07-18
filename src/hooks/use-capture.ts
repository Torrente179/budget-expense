"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyEnvelopeLimitsAfterExpense } from "@/lib/budgeting/notify-envelope-limits";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import type { ExpenseWithCategory, IncomeEntry } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface ExpenseCaptureValues {
  amount: number;
  currency: string;
  category_id: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface IncomeCaptureValues {
  amount: number;
  currency: string;
  source: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

/**
 * The one write-path for movements: optimistic expense quick-add with
 * Undo, income create, and edits for both. Everything invalidates
 * through the central query keys so all screens stay in sync.
 */
export function useCapture() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const { convert } = useCurrency();

  const invalidateExpenses = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
      ]),
    [queryClient]
  );

  const invalidateIncomes = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
      ]),
    [queryClient]
  );

  const addExpenseMutation = useMutation({
    mutationFn: async (input: {
      values: ExpenseCaptureValues;
      category: Category;
    }) =>
      authorizedFetch<{ expense: ExpenseWithCategory }>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(input.values),
      }),

    onMutate: async ({ values, category }) => {
      const [yearString, monthString] = values.date.split("-");
      const monthKey = [
        "expenses",
        Number(yearString),
        Number(monthString),
      ] as const;

      await queryClient.cancelQueries({ queryKey: monthKey });

      const optimistic: ExpenseWithCategory = {
        id: `optimistic-${Date.now()}`,
        user_id: "",
        category_id: values.category_id,
        recurring_expense_id: null,
        recurring_month: null,
        amount: values.amount,
        currency: values.currency,
        description: values.description?.trim() || null,
        date: values.date,
        source_kind: "manual",
        external_ref: null,
        import_batch_id: null,
        needs_review: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categories: category,
      };

      queryClient.setQueriesData<ExpenseWithCategory[]>(
        { queryKey: monthKey },
        (old) => (old ? [optimistic, ...old] : old)
      );

      return { monthKey };
    },

    onError: (_error, _input, context) => {
      if (context) {
        void queryClient.invalidateQueries({ queryKey: context.monthKey });
      }
      toast.error(
        t("Could not save the expense", "No se pudo guardar el gasto")
      );
    },

    onSuccess: async (result, variables) => {
      await invalidateExpenses();
      const created = result.expense;
      toast.success(t("Expense added", "Gasto añadido"), {
        duration: 5000,
        action: {
          label: t("Undo", "Deshacer"),
          onClick: () => {
            void authorizedFetch(`/api/expenses/${created.id}`, {
              method: "DELETE",
            })
              .then(() => invalidateExpenses())
              .catch(() =>
                toast.error(t("Could not undo", "No se pudo deshacer"))
              );
          },
        },
      });
      void notifyEnvelopeLimitsAfterExpense({
        categoryId: variables.values.category_id,
        date: variables.values.date,
        convert,
        t,
      });
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: async (values: IncomeCaptureValues) =>
      authorizedFetch<{ ok: true }>("/api/incomes", {
        method: "POST",
        body: JSON.stringify(values),
      }),

    onMutate: async (values) => {
      const [yearString, monthString] = values.date.split("-");
      const monthKey = [
        "incomes",
        Number(yearString),
        Number(monthString),
      ] as const;

      await queryClient.cancelQueries({ queryKey: monthKey });

      const optimistic: IncomeEntry = {
        id: `optimistic-${Date.now()}`,
        user_id: "",
        source: values.source.trim(),
        amount: values.amount,
        currency: values.currency,
        description: values.description?.trim() || null,
        date: values.date,
        source_kind: "manual",
        external_ref: null,
        import_batch_id: null,
        needs_review: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueriesData<IncomeEntry[]>(
        { queryKey: monthKey },
        (old) => (old ? [optimistic, ...old] : old)
      );

      return { monthKey };
    },

    onError: (_error, _input, context) => {
      if (context) {
        void queryClient.invalidateQueries({ queryKey: context.monthKey });
      }
      toast.error(
        t("Could not save the income", "No se pudo guardar el ingreso")
      );
    },
    onSuccess: async () => {
      await invalidateIncomes();
      toast.success(t("Income added", "Ingreso añadido"));
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Database["public"]["Tables"]["expenses"]["Update"];
    }) =>
      authorizedFetch(`/api/expenses/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input.updates),
      }),
    onError: () => {
      toast.error(t("Could not save changes", "No se pudieron guardar los cambios"));
    },
    onSuccess: async () => {
      await invalidateExpenses();
      toast.success(t("Expense updated", "Gasto actualizado"));
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Database["public"]["Tables"]["income_entries"]["Update"];
    }) =>
      authorizedFetch(`/api/incomes/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input.updates),
      }),
    onError: () => {
      toast.error(t("Could not save changes", "No se pudieron guardar los cambios"));
    },
    onSuccess: async () => {
      await invalidateIncomes();
      toast.success(t("Income updated", "Ingreso actualizado"));
    },
  });

  return {
    addExpense: (values: ExpenseCaptureValues, category: Category) =>
      addExpenseMutation.mutateAsync({ values, category }),
    addIncome: (values: IncomeCaptureValues) =>
      addIncomeMutation.mutateAsync(values),
    updateExpense: (
      id: string,
      updates: Database["public"]["Tables"]["expenses"]["Update"]
    ) => updateExpenseMutation.mutateAsync({ id, updates }),
    updateIncome: (
      id: string,
      updates: Database["public"]["Tables"]["income_entries"]["Update"]
    ) => updateIncomeMutation.mutateAsync({ id, updates }),
    saving:
      addExpenseMutation.isPending ||
      addIncomeMutation.isPending ||
      updateExpenseMutation.isPending ||
      updateIncomeMutation.isPending,
  };
}
