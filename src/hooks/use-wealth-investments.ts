"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { useCurrency } from "@/providers/currency-provider";
import type { Database } from "@/types/database";

export type WealthInvestment =
  Database["public"]["Tables"]["wealth_investments"]["Row"];

export interface ResolvedInvestment extends WealthInvestment {
  valueBase: number;
  costBase: number;
  /** Unrealized: value − cost. Not income until it is sold. */
  gainBase: number;
  /** null when nothing was contributed, so no fake infinite return. */
  returnRatio: number | null;
}

/** Manually valued holdings, converted to the base currency. */
export function useWealthInvestments() {
  const { convert } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.wealthInvestments,
    queryFn: () =>
      authorizedFetch<{ investments: WealthInvestment[] }>(
        "/api/wealth/investments"
      ),
  });

  const investments = useMemo<ResolvedInvestment[]>(
    () =>
      (data?.investments ?? [])
        .filter((row) => row.status === "active")
        .map((row) => {
          const valueBase = convert(Number(row.current_value), row.currency);
          const costBase = convert(Number(row.contributed_cost), row.currency);
          return {
            ...row,
            valueBase,
            costBase,
            gainBase: valueBase - costBase,
            returnRatio: costBase > 0 ? (valueBase - costBase) / costBase : null,
          };
        }),
    [data, convert]
  );

  const totals = useMemo(
    () =>
      investments.reduce(
        (acc, item) => ({
          value: acc.value + item.valueBase,
          cost: acc.cost + item.costBase,
          gain: acc.gain + item.gainBase,
        }),
        { value: 0, cost: 0, gain: 0 }
      ),
    [investments]
  );

  const createInvestment = useMutation({
    mutationFn: (values: object) =>
      authorizedFetch<{ investment: WealthInvestment }>(
        "/api/wealth/investments",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wealthInvestments }),
  });

  const updateInvestment = useMutation({
    mutationFn: ({ id, values }: { id: string; values: object }) =>
      authorizedFetch<{ investment: WealthInvestment }>(
        `/api/wealth/investments/${id}`,
        { method: "PATCH", body: JSON.stringify(values) }
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wealthInvestments }),
  });

  return {
    investments,
    totals,
    count: investments.length,
    loading: isPending,
    refetch,
    createInvestment,
    updateInvestment,
  };
}
