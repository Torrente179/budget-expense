"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { accountBalance } from "@/lib/wealth/net-worth";
import { useCurrency } from "@/providers/currency-provider";
import type { Database } from "@/types/database";

export type WealthAccount =
  Database["public"]["Tables"]["wealth_accounts"]["Row"];
export type WealthAccountMovement =
  Database["public"]["Tables"]["wealth_account_movements"]["Row"];

export interface ResolvedAccount extends WealthAccount {
  /** opening_balance + Σ movements, in the account's own currency. */
  balance: number;
  balanceBase: number;
  movements: WealthAccountMovement[];
}

interface AccountsResponse {
  accounts: WealthAccount[];
  movements: WealthAccountMovement[];
}

const EMPTY: AccountsResponse = { accounts: [], movements: [] };

/** Cuentas y efectivo — the liquid slice of the balance sheet. */
export function useWealthAccounts() {
  const { convert } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, refetch } = useQuery({
    queryKey: queryKeys.wealthAccounts,
    queryFn: () => authorizedFetch<AccountsResponse>("/api/wealth/accounts"),
  });

  const resolved = useMemo<ResolvedAccount[]>(() => {
    const source = data ?? EMPTY;

    return source.accounts.map((account) => {
      const movements = source.movements.filter(
        (movement) => movement.account_id === account.id
      );
      const balance = accountBalance(account, movements);

      return {
        ...account,
        movements,
        balance,
        balanceBase: convert(balance, account.currency),
      };
    });
  }, [data, convert]);

  const active = useMemo(
    () => resolved.filter((account) => account.status === "active"),
    [resolved]
  );

  const totalBase = useMemo(
    () => active.reduce((sum, account) => sum + account.balanceBase, 0),
    [active]
  );

  /** Only what is spendable — this is NOT part of net worth. */
  const availableBase = useMemo(
    () =>
      active.reduce(
        (sum, account) =>
          account.include_in_available ? sum + account.balanceBase : sum,
        0
      ),
    [active]
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.wealthAccounts });

  const createAccount = useMutation({
    mutationFn: (values: object) =>
      authorizedFetch<{ account: WealthAccount }>("/api/wealth/accounts", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: invalidate,
  });

  /**
   * Archive, not delete. Movements cascade on delete, so removing an account
   * with history silently rewrites past net worth.
   */
  const archiveAccount = useMutation({
    mutationFn: (id: string) =>
      authorizedFetch<{ account: WealthAccount }>(
        `/api/wealth/accounts/${id}`,
        { method: "PATCH", body: JSON.stringify({ status: "archived" }) }
      ),
    onSuccess: invalidate,
  });

  /**
   * Exactly one account can be primary — a partial unique index enforces it —
   * so promoting one demotes the incumbent first, or the insert 409s.
   */
  const setPrimaryAccount = useMutation({
    mutationFn: async (id: string) => {
      const current = resolved.find((account) => account.is_primary);
      if (current && current.id !== id) {
        await authorizedFetch(`/api/wealth/accounts/${current.id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_primary: false }),
        });
      }
      return authorizedFetch(`/api/wealth/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_primary: true }),
      });
    },
    onSuccess: invalidate,
  });

  return {
    accounts: resolved,
    archiveAccount,
    setPrimaryAccount,
    activeAccounts: active,
    movements: data?.movements ?? [],
    totalBase,
    availableBase,
    count: active.length,
    loading: isPending,
    refetch,
    createAccount,
  };
}
