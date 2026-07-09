"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchExpenses,
  fetchIncomes,
  fetchMonthlySummaryRaw,
} from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";

function adjacentMonths(month: number, year: number) {
  const prev =
    month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next =
    month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  return [prev, next];
}

/**
 * After the current month finishes loading, prefetch adjacent months into the
 * react-query cache so prev/next navigation feels instant.
 */
export function usePrefetchMonths(
  month: number,
  year: number,
  loading: boolean
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;

    // Fire after a short idle to avoid competing with the current page's fetches
    const timer = setTimeout(() => {
      for (const adjacent of adjacentMonths(month, year)) {
        const { month: m, year: y } = adjacent;
        void queryClient.prefetchQuery({
          queryKey: queryKeys.expenses({ month: m, year: y }),
          queryFn: () => fetchExpenses({ month: m, year: y }),
        });
        void queryClient.prefetchQuery({
          queryKey: queryKeys.incomes({ month: m, year: y }),
          queryFn: () => fetchIncomes({ month: m, year: y }),
        });
        void queryClient.prefetchQuery({
          queryKey: queryKeys.monthlySummary(m, y),
          queryFn: () => fetchMonthlySummaryRaw(m, y),
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [month, year, loading, queryClient]);
}
