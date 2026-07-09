"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import type { ExpenseWithCategory } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface QuickAddValues {
  amount: number;
  currency: string;
  category_id: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

/**
 * Optimistic quick-add: the row appears in every cached list for its month
 * instantly, the POST confirms it, and a 5s toast offers Undo (delete).
 * On failure the caches are invalidated so no phantom rows survive.
 */
export function useQuickAddExpense() {
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const mutation = useMutation({
    mutationFn: async (input: { values: QuickAddValues; category: Category }) =>
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

      // Insert into every cached list for that month (any filter variant
      // whose category/search would include it is refreshed on settle anyway)
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

    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
      ]);

      const created = result.expense;
      toast.success(t("Expense added", "Gasto añadido"), {
        duration: 5000,
        action: {
          label: t("Undo", "Deshacer"),
          onClick: () => {
            void authorizedFetch(`/api/expenses/${created.id}`, {
              method: "DELETE",
            })
              .then(() =>
                Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.expensesAll,
                  }),
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.monthlySummaryAll,
                  }),
                ])
              )
              .catch(() =>
                toast.error(t("Could not undo", "No se pudo deshacer"))
              );
          },
        },
      });
    },
  });

  return {
    quickAdd: (values: QuickAddValues, category: Category) =>
      mutation.mutateAsync({ values, category }),
    saving: mutation.isPending,
  };
}
