"use client";

import { useEffect } from "react";
import { format } from "date-fns";
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

export type PrefetchMode = "summary" | "ledger" | "all";

/**
 * After the current month finishes loading, prefetch adjacent months into the
 * react-query cache so prev/next navigation feels instant.
 *
 * - summary: Home — only monthly summary (covers aggregates + recent list)
 * - ledger: Movements — expenses + incomes
 * - all: both (legacy / heavy screens)
 */
export function usePrefetchMonths(
  month: number,
  year: number,
  loading: boolean,
  mode: PrefetchMode = "all"
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;

    // Fire after a short idle to avoid competing with the current page's fetches
    const timer = setTimeout(() => {
      const asOfDate = format(new Date(), "yyyy-MM-dd");
      for (const adjacent of adjacentMonths(month, year)) {
        const { month: m, year: y } = adjacent;
        if (mode === "summary" || mode === "all") {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.monthlySummary(m, y, asOfDate),
            queryFn: () => fetchMonthlySummaryRaw(m, y, asOfDate),
          });
        }
        if (mode === "ledger" || mode === "all") {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.expenses({ month: m, year: y }),
            queryFn: () => fetchExpenses({ month: m, year: y }),
          });
          void queryClient.prefetchQuery({
            queryKey: queryKeys.incomes({ month: m, year: y }),
            queryFn: () => fetchIncomes({ month: m, year: y }),
          });
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [month, year, loading, mode, queryClient]);
}
