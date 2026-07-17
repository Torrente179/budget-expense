"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import type { ExpenseWithCategory } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";

const reviewKey = ["review-queue"] as const;
const reviewCountKey = ["review-count"] as const;

export function useReviewQueue() {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: reviewKey,
    staleTime: 60 * 1000,
    queryFn: () =>
      authorizedFetch<{
        expenses: ExpenseWithCategory[];
        count: number;
        available: boolean;
      }>("/api/insights/review"),
  });

  const categorize = useMutation({
    mutationFn: async (input: {
      expenseId: string;
      categoryId: string;
      remember?: { pattern: string };
    }) => {
      await authorizedFetch(`/api/expenses/${input.expenseId}`, {
        method: "PATCH",
        body: JSON.stringify({
          category_id: input.categoryId,
          needs_review: false,
        }),
      });
      if (input.remember) {
        await authorizedFetch("/api/categorization/rules", {
          method: "POST",
          body: JSON.stringify({
            pattern: input.remember.pattern,
            categoryId: input.categoryId,
          }),
        }).catch(() => {
          // Rule persistence is best-effort; the categorization already stuck
        });
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKey }),
        queryClient.invalidateQueries({ queryKey: reviewCountKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
        queryClient.invalidateQueries({ queryKey: ["household-insights"] }),
      ]),
  });

  return {
    expenses: data?.expenses ?? [],
    count: data?.count ?? 0,
    available: data?.available ?? true,
    loading: isPending,
    categorize,
  };
}

/** Lightweight count for nav badges — does not load the full review queue. */
export function useReviewCount() {
  const { data, isPending } = useQuery({
    queryKey: reviewCountKey,
    staleTime: 60 * 1000,
    queryFn: () =>
      authorizedFetch<{ count: number; available: boolean }>(
        "/api/insights/review/count"
      ),
  });

  return isPending ? 0 : (data?.count ?? 0);
}
