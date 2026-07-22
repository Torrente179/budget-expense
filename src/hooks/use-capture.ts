"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyEnvelopeLimitsAfterExpense } from "@/lib/budgeting/notify-envelope-limits";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import {
  createExpense,
  createIncome,
  deleteExpense,
  updateExpense,
  updateIncome,
} from "@/lib/data";
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

export interface LoanCaptureValues {
  borrower_name: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  movement_description: string;
}

export interface IncomeCaptureValues {
  amount: number;
  currency: string;
  source: string;
  date: string; // YYYY-MM-DD
  description?: string;
  category_id?: string | null;
  loan_id?: string;
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
    (date?: string) => {
      const [year, month] = date?.split("-").map(Number) ?? [];
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            year && month ? ["expenses", year, month] : queryKeys.expensesAll,
        }),
        queryClient.invalidateQueries({
          queryKey:
            year && month
              ? ["month-snapshot", year, month]
              : queryKeys.monthSnapshotAll,
        }),
      ]);
    },
    [queryClient]
  );

  const invalidateIncomes = useCallback(
    (date?: string) => {
      const [year, month] = date?.split("-").map(Number) ?? [];
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            year && month ? ["incomes", year, month] : queryKeys.incomesAll,
        }),
        queryClient.invalidateQueries({
          queryKey:
            year && month
              ? ["month-snapshot", year, month]
              : queryKeys.monthSnapshotAll,
        }),
      ]);
    },
    [queryClient]
  );

  const addExpenseMutation = useMutation({
    mutationFn: async (input: {
      values: ExpenseCaptureValues;
      category: Category;
    }) => createExpense(input.values),

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

    onSuccess: (created, variables) => {
      void invalidateExpenses(variables.values.date);
      toast.success(t("Expense added", "Gasto añadido"), {
        duration: 5000,
        action: {
          label: t("Undo", "Deshacer"),
          onClick: () => {
            void deleteExpense(created.expense.id)
              .then(() => invalidateExpenses(variables.values.date))
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
        context: created.envelopeContext,
      });
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: async (values: IncomeCaptureValues) => {
      if (values.loan_id) {
        return authorizedFetch<{ ok: true }>("/api/incomes", {
          method: "POST",
          body: JSON.stringify(values),
        });
      }
      return createIncome(values);
    },

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
        category_id: values.category_id ?? null,
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
    onSuccess: (_result, values) => {
      void invalidateIncomes(values.date);
      if (values.loan_id) {
        void queryClient.invalidateQueries({ queryKey: ["loans"] });
      }
      toast.success(t("Income added", "Ingreso añadido"));
    },
  });

  const addLoanMutation = useMutation({
    mutationFn: async (values: LoanCaptureValues) =>
      authorizedFetch<{ loan: { id: string; expense_id: string | null } }>(
        "/api/loans",
        {
          method: "POST",
          body: JSON.stringify({
            borrower_name: values.borrower_name.trim(),
            principal: values.amount,
            currency: values.currency,
            lent_date: values.date,
            notes: values.description?.trim() || null,
            movement_description: values.movement_description,
            create_movement: true,
          }),
        }
      ),
    onError: () => {
      toast.error(
        t("Could not save the loan", "No se pudo guardar el préstamo")
      );
    },
    onSuccess: (result, values) => {
      void invalidateExpenses(values.date);
      void queryClient.invalidateQueries({ queryKey: ["loans"] });
      const loanId = result.loan.id;
      toast.success(
        t(
          "Loan added in Movements and Wealth",
          "Préstamo añadido en Movimientos y Patrimonio"
        ),
        {
          duration: 5000,
          action: {
            label: t("Undo", "Deshacer"),
            onClick: () => {
              void authorizedFetch(
                `/api/loans/${loanId}?delete_expense=1`,
                { method: "DELETE" }
              )
                .then(() =>
                  Promise.all([
                    invalidateExpenses(values.date),
                    queryClient.invalidateQueries({ queryKey: ["loans"] }),
                  ])
                )
                .catch(() =>
                  toast.error(t("Could not undo", "No se pudo deshacer"))
                );
            },
          },
        }
      );
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Database["public"]["Tables"]["expenses"]["Update"];
    }) => updateExpense(input.id, input.updates),
    onError: () => {
      toast.error(t("Could not save changes", "No se pudieron guardar los cambios"));
    },
    onSuccess: (_result, input) => {
      void invalidateExpenses(input.updates.date);
      toast.success(t("Expense updated", "Gasto actualizado"));
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Database["public"]["Tables"]["income_entries"]["Update"];
    }) => updateIncome(input.id, input.updates),
    onError: () => {
      toast.error(t("Could not save changes", "No se pudieron guardar los cambios"));
    },
    onSuccess: (_result, input) => {
      void invalidateIncomes(input.updates.date);
      toast.success(t("Income updated", "Ingreso actualizado"));
    },
  });

  return {
    addExpense: (values: ExpenseCaptureValues, category: Category) =>
      addExpenseMutation.mutateAsync({ values, category }),
    addLoan: (values: LoanCaptureValues) =>
      addLoanMutation.mutateAsync(values),
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
      addLoanMutation.isPending ||
      addIncomeMutation.isPending ||
      updateExpenseMutation.isPending ||
      updateIncomeMutation.isPending,
  };
}
