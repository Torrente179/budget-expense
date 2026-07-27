"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import {
  computeCushion,
  computeMonthlyChange,
  computeNetWorth,
  resolvePreviousMonthClosing,
  sumLoansOutstandingBase,
  type Cushion,
  type MonthlyChange,
  type NetWorthSnapshotPoint,
  type NetWorthTotals,
} from "@/lib/wealth/net-worth";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useInvestments } from "@/hooks/use-investments";
import { useWealthAccounts } from "@/hooks/use-wealth-accounts";
import { useWealthInvestments } from "@/hooks/use-wealth-investments";
import { useCurrency } from "@/providers/currency-provider";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["net_worth_snapshots"]["Row"];

export interface WealthCounts {
  accounts: number;
  savings: number;
  investments: number;
  loans: number;
  debts: number;
}

export interface NetWorthResult {
  totals: NetWorthTotals;
  monthlyChange: MonthlyChange;
  cushion: Cushion;
  snapshots: NetWorthSnapshotPoint[];
  counts: WealthCounts;
  /** Spendable today — deliberately not rendered as a Patrimonio headline. */
  availableBase: number;
  /**
   * True only when the user has no wealth rows at all. Gate the empty state on
   * this, never on `netWorth === 0`: someone with only debts has a negative
   * net worth and must still see the populated screen.
   */
  isEmpty: boolean;
  loading: boolean;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The one place net worth is computed. Every Patrimonio surface reads from
 * here, so no screen re-derives a total and none of them can disagree.
 */
export function useNetWorth(): NetWorthResult {
  const { convert } = useCurrency();
  const { insights, loading: insightsLoading } = useHouseholdInsights();
  const {
    overview,
    totalSavingsBalance,
    savingsAccountSummaries,
    loading: investmentsLoading,
  } = useInvestments({
    includeTrades: false,
    includeCash: false,
    includeSavings: true,
    includeWatchlist: false,
  });
  const {
    totalBase: accountsBase,
    availableBase,
    count: accountsCount,
    loading: accountsLoading,
  } = useWealthAccounts();
  const {
    totals: manualInvestments,
    count: manualInvestmentCount,
    loading: manualInvestmentsLoading,
  } = useWealthInvestments();

  const { data: loansData, isPending: loansLoading } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: () =>
      authorizedFetch<{ loans: Loan[]; repayments: LoanRepayment[] }>(
        "/api/loans"
      ),
  });

  const { data: snapshotData, isPending: snapshotsLoading } = useQuery({
    queryKey: queryKeys.netWorthSnapshots,
    queryFn: () =>
      authorizedFetch<{ snapshots: SnapshotRow[] }>("/api/wealth/snapshots"),
  });

  const snapshots = useMemo<NetWorthSnapshotPoint[]>(
    () =>
      (snapshotData?.snapshots ?? []).map((row) => ({
        asOfDate: row.as_of_date,
        netWorth: Number(row.net_worth),
        totalAssets: Number(row.total_assets),
        totalLiabilities: Number(row.total_liabilities),
      })),
    [snapshotData]
  );

  const moneyLent = useMemo(
    () =>
      loansData
        ? sumLoansOutstandingBase(
            loansData.loans,
            loansData.repayments,
            convert
          )
        : 0,
    [loansData, convert]
  );

  const totals = useMemo(
    () =>
      computeNetWorth({
        accountsAndCash: accountsBase,
        savings: totalSavingsBalance,
        // Two investment models, never overlapping: trade-tracked positions
        // (FIFO lots + live quotes) and manually valued holdings.
        investments:
          overview.totalMarketValue +
          overview.estimatedCash +
          manualInvestments.value,
        moneyLent,
        debts: insights?.totalLiabilitiesBase ?? 0,
      }),
    [
      accountsBase,
      totalSavingsBalance,
      overview.totalMarketValue,
      overview.estimatedCash,
      manualInvestments.value,
      moneyLent,
      insights?.totalLiabilitiesBase,
    ]
  );

  const monthlyChange = useMemo(
    () =>
      computeMonthlyChange(
        totals.netWorth,
        resolvePreviousMonthClosing(snapshots, todayIso())
      ),
    [totals.netWorth, snapshots]
  );

  /**
   * Only genuinely liquid money counts toward the cushion. Broker cash stays
   * in because it already did before this rework and silently shrinking a
   * number the user has seen would be worse than the imprecision.
   */
  const essentialMonthlyAvg = insights?.hasEssentialData
    ? insights.essentialMonthlyAvg
    : null;

  const cushion = useMemo(
    () =>
      computeCushion({
        liquidEmergencySavings:
          accountsBase + totalSavingsBalance + overview.estimatedCash,
        averageMonthlyEssentialExpenses: essentialMonthlyAvg,
      }),
    [
      accountsBase,
      totalSavingsBalance,
      overview.estimatedCash,
      essentialMonthlyAvg,
    ]
  );

  const counts = useMemo<WealthCounts>(
    () => ({
      accounts: accountsCount,
      savings: savingsAccountSummaries?.length ?? 0,
      investments: overview.openPositionsCount + manualInvestmentCount,
      loans: loansData?.loans.filter((loan) => loan.is_active).length ?? 0,
      debts: insights?.liabilities.filter((l) => l.isActive).length ?? 0,
    }),
    [
      accountsCount,
      savingsAccountSummaries,
      overview.openPositionsCount,
      manualInvestmentCount,
      loansData,
      insights?.liabilities,
    ]
  );

  const loading =
    insightsLoading ||
    investmentsLoading ||
    accountsLoading ||
    manualInvestmentsLoading ||
    loansLoading ||
    snapshotsLoading;

  const isEmpty =
    !loading &&
    counts.accounts === 0 &&
    counts.savings === 0 &&
    counts.investments === 0 &&
    counts.loans === 0 &&
    counts.debts === 0;

  useRecordNetWorthSnapshot({ totals, loading, isEmpty });

  return {
    totals,
    monthlyChange,
    cushion,
    snapshots,
    counts,
    availableBase,
    isEmpty,
    loading,
  };
}

/**
 * Writes today's snapshot once the numbers settle.
 *
 * It lives on the client because conversion to the base currency only exists
 * here — the server has no FX rates, so neither a trigger nor a cron could
 * compute net worth.
 *
 * Two guards stop it looping: a ref holding the last attempted
 * date+value, and a server-side upsert on (user_id, as_of_date) that makes a
 * duplicate request idempotent. On success it writes straight into the cache
 * rather than invalidating — invalidating would refetch, recompute, and
 * re-fire.
 */
function useRecordNetWorthSnapshot(input: {
  totals: NetWorthTotals;
  loading: boolean;
  isEmpty: boolean;
}) {
  const { baseCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const lastAttemptRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authorizedFetch<{ snapshot: SnapshotRow }>("/api/wealth/snapshots", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (result) => {
      queryClient.setQueryData<{ snapshots: SnapshotRow[] }>(
        queryKeys.netWorthSnapshots,
        (previous) => {
          const rest = (previous?.snapshots ?? []).filter(
            (row) => row.as_of_date !== result.snapshot.as_of_date
          );
          return {
            snapshots: [...rest, result.snapshot].sort((a, b) =>
              a.as_of_date.localeCompare(b.as_of_date)
            ),
          };
        }
      );
    },
  });

  const { totals, loading, isEmpty } = input;
  const { mutate, isPending } = mutation;

  useEffect(() => {
    if (loading || isEmpty || isPending) return;
    if (!Number.isFinite(totals.netWorth)) return;

    const asOfDate = todayIso();
    const fingerprint = `${asOfDate}:${baseCurrency}:${Math.round(
      totals.netWorth * 100
    )}`;
    if (lastAttemptRef.current === fingerprint) return;
    lastAttemptRef.current = fingerprint;

    mutate({
      as_of_date: asOfDate,
      base_currency: baseCurrency,
      accounts_and_cash: totals.accountsAndCash,
      savings: totals.savings,
      investments: totals.investments,
      money_lent: totals.moneyLent,
      debts: totals.debts,
    });
  }, [loading, isEmpty, isPending, totals, baseCurrency, mutate]);
}
