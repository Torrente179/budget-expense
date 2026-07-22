"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvestmentSnapshot,
  requestInvestmentMutation,
  type InvestmentSnapshot,
} from "@/lib/investments-api-client";
import type {
  InvestmentSavingsAccountRow,
  InvestmentSavingsTransferWithJoins,
} from "@/lib/investments";
import type { InvestmentSavingsTransferFormValues } from "@/lib/validations";
import { queryKeys } from "@/lib/query/keys";

function getMonthRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = new Date(year, month, 1);
  return {
    startDate,
    endDate: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
  };
}

export function useInvestmentSavings({
  month,
  year,
}: { month?: number; year?: number } = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.investmentSnapshot,
    queryFn: ({ signal }) => fetchInvestmentSnapshot(signal),
  });
  const savingsAccounts = (query.data?.savingsAccounts ?? []) as InvestmentSavingsAccountRow[];
  const savingsTransfers = useMemo(() => {
    const rows = (query.data?.savingsTransfers ?? []).filter(
      (transfer): transfer is InvestmentSavingsTransferWithJoins =>
        Boolean(transfer.investment_savings_accounts)
    );
    if (month === undefined || year === undefined) return rows;
    const { startDate, endDate } = getMonthRange(month, year);
    return rows.filter(
      (transfer) =>
        transfer.transfer_date >= startDate && transfer.transfer_date < endDate
    );
  }, [month, query.data?.savingsTransfers, year]);

  function refresh(date?: string) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.investmentSnapshot });
    if (date) {
      const [targetYear, targetMonth] = date.split("-").map(Number);
      void queryClient.invalidateQueries({
        queryKey: ["month-snapshot", targetYear, targetMonth],
      });
    }
  }

  async function addSavingsTransfer(values: InvestmentSavingsTransferFormValues) {
    try {
      await requestInvestmentMutation("POST", { resource: "savingsTransfer", values });
      refresh(values.transfer_date);
      return null;
    } catch (error) {
      return error;
    }
  }

  async function updateSavingsTransfer(
    id: string,
    values: InvestmentSavingsTransferFormValues
  ) {
    try {
      await requestInvestmentMutation("PATCH", {
        resource: "savingsTransfer",
        id,
        values,
      });
      refresh(values.transfer_date);
      return null;
    } catch (error) {
      return error;
    }
  }

  async function deleteSavingsTransfer(id: string) {
    const previousDate = (
      queryClient.getQueryData<InvestmentSnapshot>(queryKeys.investmentSnapshot)
        ?.savingsTransfers ?? []
    ).find((transfer) => transfer.id === id)?.transfer_date;
    try {
      await requestInvestmentMutation("DELETE", { resource: "savingsTransfer", id });
      refresh(previousDate);
      return null;
    } catch (error) {
      return error;
    }
  }

  return {
    savingsAccounts,
    savingsTransfers,
    loading: query.isPending,
    refetch: query.refetch,
    addSavingsTransfer,
    updateSavingsTransfer,
    deleteSavingsTransfer,
  };
}
