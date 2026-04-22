"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchInvestmentSnapshot,
  requestInvestmentMutation,
} from "@/lib/investments-api-client";
import type {
  InvestmentSavingsAccountRow,
  InvestmentSavingsTransferWithJoins,
} from "@/lib/investments";
import type { InvestmentSavingsTransferFormValues } from "@/lib/validations";

interface UseInvestmentSavingsOptions {
  month?: number;
  year?: number;
}

function getMonthRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  return { startDate, endDate };
}

type SavingsTransferWithOptionalJoins = Omit<
  InvestmentSavingsTransferWithJoins,
  "investment_savings_accounts"
> & {
  investment_savings_accounts:
    | InvestmentSavingsTransferWithJoins["investment_savings_accounts"]
    | null;
};

function hasSavingsTransferJoins(
  transfer: SavingsTransferWithOptionalJoins
): transfer is InvestmentSavingsTransferWithJoins {
  return Boolean(transfer.investment_savings_accounts);
}

export function useInvestmentSavings({
  month,
  year,
}: UseInvestmentSavingsOptions = {}) {
  const [savingsAccounts, setSavingsAccounts] = useState<
    InvestmentSavingsAccountRow[]
  >([]);
  const [savingsTransfers, setSavingsTransfers] = useState<
    InvestmentSavingsTransferWithJoins[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchInvestmentSnapshot();
      const filteredTransfers =
        month !== undefined && year !== undefined
          ? (snapshot.savingsTransfers as SavingsTransferWithOptionalJoins[]).filter(
              (transfer) => {
                const { startDate, endDate } = getMonthRange(month, year);
                return (
                  transfer.transfer_date >= startDate &&
                  transfer.transfer_date < endDate
                );
              }
            )
          : (snapshot.savingsTransfers as SavingsTransferWithOptionalJoins[]);

      setSavingsAccounts(snapshot.savingsAccounts as InvestmentSavingsAccountRow[]);
      setSavingsTransfers(filteredTransfers.filter(hasSavingsTransferJoins));
    } catch (error) {
      console.error("Failed to fetch investment savings data", error);
      setSavingsAccounts([]);
      setSavingsTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function addSavingsTransfer(values: InvestmentSavingsTransferFormValues) {
    try {
      await requestInvestmentMutation("POST", {
        resource: "savingsTransfer",
        values,
      });
      await fetchData();
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
      await fetchData();
      return null;
    } catch (error) {
      return error;
    }
  }

  async function deleteSavingsTransfer(id: string) {
    try {
      await requestInvestmentMutation("DELETE", {
        resource: "savingsTransfer",
        id,
      });
      await fetchData();
      return null;
    } catch (error) {
      return error;
    }
  }

  return {
    savingsAccounts,
    savingsTransfers,
    loading,
    refetch: fetchData,
    addSavingsTransfer,
    updateSavingsTransfer,
    deleteSavingsTransfer,
  };
}
