"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { useCurrency } from "@/providers/currency-provider";

type Bucket = "giving" | "essential" | "discretionary" | "savings";

interface HouseholdApiResponse {
  startMonth: string;
  expenses: {
    month: string;
    bucket: Bucket;
    currency: string;
    total: number;
    count: number;
  }[];
  incomes: { month: string; currency: string; total: number }[];
  categories: {
    month: string;
    categoryId: string;
    categoryName: string;
    currency: string;
    total: number;
    count: number;
  }[];
  liabilities: {
    id: string;
    name: string;
    kind: string;
    currency: string;
    original_balance: number;
    interest_rate_percent: number | null;
    is_active: boolean;
    paid_total: number;
  }[];
  titheTargetPercent: number;
  settingsAvailable: boolean;
}

export interface HouseholdInsights {
  /** Trailing-12M totals in base currency */
  income12M: number;
  expenses12M: number;
  giving12M: number;
  /** Three complementary rates (0..1), null when income12M is 0 */
  givingRate: number | null;
  spendingRate: number | null;
  savingsRate: number | null;
  /** Avg monthly essential spend over the trailing window (base currency) */
  essentialMonthlyAvg: number | null;
  /** true when at least one expense hit an essential-classified category */
  hasEssentialData: boolean;
  /** Giving rate per month (for trends) */
  monthlyGivingRates: { month: string; rate: number | null }[];
  /** month × category totals, base currency (anomaly detection input) */
  categoryMonthTotals: {
    month: string;
    categoryId: string;
    categoryName: string;
    total: number;
  }[];
  /** Liabilities with derived current balances (own currency + base) */
  liabilities: {
    id: string;
    name: string;
    kind: string;
    currency: string;
    currentBalance: number;
    currentBalanceBase: number;
    interestRatePercent: number | null;
    isActive: boolean;
  }[];
  totalLiabilitiesBase: number;
  /** Base-currency liability total per original currency (for FX exposure) */
  liabilitiesByCurrency: Record<string, number>;
  titheTargetPercent: number;
  settingsAvailable: boolean;
}

const ESSENTIAL_WINDOW_MONTHS = 6;

export function useHouseholdInsights() {
  const { convert } = useCurrency();

  const { data, isPending, refetch } = useQuery({
    queryKey: ["household-insights"],
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      authorizedFetch<HouseholdApiResponse>("/api/insights/household"),
  });

  const insights = useMemo<HouseholdInsights | null>(() => {
    if (!data) return null;

    const income12M = data.incomes.reduce(
      (sum, row) => sum + convert(row.total, row.currency),
      0
    );
    const expenses12M = data.expenses.reduce(
      (sum, row) => sum + convert(row.total, row.currency),
      0
    );
    const giving12M = data.expenses
      .filter((row) => row.bucket === "giving")
      .reduce((sum, row) => sum + convert(row.total, row.currency), 0);

    const givingRate = income12M > 0 ? giving12M / income12M : null;
    const spendingRate =
      income12M > 0 ? (expenses12M - giving12M) / income12M : null;
    const savingsRate =
      income12M > 0 ? 1 - (givingRate ?? 0) - (spendingRate ?? 0) : null;

    // Essential burn: average over the most recent months that have data
    const essentialByMonth = new Map<string, number>();
    for (const row of data.expenses) {
      if (row.bucket !== "essential") continue;
      essentialByMonth.set(
        row.month,
        (essentialByMonth.get(row.month) ?? 0) +
          convert(row.total, row.currency)
      );
    }
    const essentialMonths = [...essentialByMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, ESSENTIAL_WINDOW_MONTHS);
    const hasEssentialData = essentialMonths.length > 0;
    const essentialMonthlyAvg = hasEssentialData
      ? essentialMonths.reduce((sum, [, total]) => sum + total, 0) /
        essentialMonths.length
      : null;

    // Monthly giving rate series
    const incomeByMonth = new Map<string, number>();
    for (const row of data.incomes) {
      incomeByMonth.set(
        row.month,
        (incomeByMonth.get(row.month) ?? 0) + convert(row.total, row.currency)
      );
    }
    const givingByMonth = new Map<string, number>();
    for (const row of data.expenses) {
      if (row.bucket !== "giving") continue;
      givingByMonth.set(
        row.month,
        (givingByMonth.get(row.month) ?? 0) + convert(row.total, row.currency)
      );
    }
    const allMonths = [
      ...new Set([...incomeByMonth.keys(), ...givingByMonth.keys()]),
    ].sort();
    const monthlyGivingRates = allMonths.map((month) => {
      const monthIncome = incomeByMonth.get(month) ?? 0;
      return {
        month,
        rate:
          monthIncome > 0
            ? (givingByMonth.get(month) ?? 0) / monthIncome
            : null,
      };
    });

    // Collapse currency dimension: convert then merge per month × category
    const categoryTotalsMap = new Map<
      string,
      { month: string; categoryId: string; categoryName: string; total: number }
    >();
    for (const row of data.categories ?? []) {
      const key = `${row.month}|${row.categoryId}`;
      const existing = categoryTotalsMap.get(key);
      const converted = convert(row.total, row.currency);
      if (existing) {
        existing.total += converted;
      } else {
        categoryTotalsMap.set(key, {
          month: row.month,
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          total: converted,
        });
      }
    }
    const categoryMonthTotals = [...categoryTotalsMap.values()];

    const liabilities = data.liabilities.map((liability) => {
      const currentBalance = Math.max(
        liability.original_balance - liability.paid_total,
        0
      );
      return {
        id: liability.id,
        name: liability.name,
        kind: liability.kind,
        currency: liability.currency,
        currentBalance,
        currentBalanceBase: convert(currentBalance, liability.currency),
        interestRatePercent: liability.interest_rate_percent,
        isActive: liability.is_active,
      };
    });
    const activeLiabilities = liabilities.filter((l) => l.isActive);
    const totalLiabilitiesBase = activeLiabilities.reduce(
      (sum, liability) => sum + liability.currentBalanceBase,
      0
    );
    const liabilitiesByCurrency: Record<string, number> = {};
    for (const liability of activeLiabilities) {
      liabilitiesByCurrency[liability.currency] =
        (liabilitiesByCurrency[liability.currency] ?? 0) +
        liability.currentBalanceBase;
    }

    return {
      income12M,
      expenses12M,
      giving12M,
      givingRate,
      spendingRate,
      savingsRate,
      essentialMonthlyAvg,
      hasEssentialData,
      monthlyGivingRates,
      categoryMonthTotals,
      liabilities,
      totalLiabilitiesBase,
      liabilitiesByCurrency,
      titheTargetPercent: data.titheTargetPercent,
      settingsAvailable: data.settingsAvailable,
    };
  }, [data, convert]);

  return { insights, loading: isPending, refetch };
}
