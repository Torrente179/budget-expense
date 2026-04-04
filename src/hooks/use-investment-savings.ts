"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
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
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let transferQuery = supabase
        .from("investment_savings_transfers")
        .select("*, investment_savings_accounts(*)")
        .order("transfer_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (month !== undefined && year !== undefined) {
        const { startDate, endDate } = getMonthRange(month, year);
        transferQuery = transferQuery
          .gte("transfer_date", startDate)
          .lt("transfer_date", endDate);
      }

      const [accountsResult, transfersResult] = await Promise.all([
        supabase
          .from("investment_savings_accounts")
          .select("*")
          .order("created_at", { ascending: true }),
        transferQuery,
      ]);

      const accounts = resolveOptionalTableResult(accountsResult, {
        table: "investment_savings_accounts",
        context: "Investment savings accounts table is unavailable during fetch",
        fallback: [],
      });
      const transfers = resolveOptionalTableResult(transfersResult, {
        table: "investment_savings_transfers",
        context: "Investment savings transfers table is unavailable during fetch",
        fallback: [],
      });

      setSavingsAccounts(accounts as InvestmentSavingsAccountRow[]);
      setSavingsTransfers(transfers as InvestmentSavingsTransferWithJoins[]);
    } catch (error) {
      console.error("Failed to fetch investment savings data", error);
      setSavingsAccounts([]);
      setSavingsTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [month, supabase, year]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getUserId = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  }, [supabase]);

  async function addSavingsTransfer(values: InvestmentSavingsTransferFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("investment_savings_transfers").insert({
      user_id: userId,
      savings_account_id: values.savings_account_id,
      transfer_date: values.transfer_date,
      amount: values.amount,
      currency: values.currency,
      notes: values.notes ?? null,
      source_kind: values.source_kind,
    });

    if (!error) {
      await fetchData();
    }

    return error;
  }

  async function updateSavingsTransfer(
    id: string,
    values: InvestmentSavingsTransferFormValues
  ) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("investment_savings_transfers")
      .update({
        savings_account_id: values.savings_account_id,
        transfer_date: values.transfer_date,
        amount: values.amount,
        currency: values.currency,
        notes: values.notes ?? null,
        source_kind: values.source_kind,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      await fetchData();
    }

    return error;
  }

  async function deleteSavingsTransfer(id: string) {
    const { error } = await supabase
      .from("investment_savings_transfers")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
    }

    return error;
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
