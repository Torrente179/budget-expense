"use client";

import { useMemo } from "react";
import { calculateTrackedBalance } from "@/lib/balance-checkpoint";
import type { MonthSnapshot } from "@/lib/data";
import type { RecentMovement } from "@/lib/query/fetchers";
import { useCurrency } from "@/providers/currency-provider";
import { useMonthSnapshot } from "@/hooks/use-month-snapshot";
import { getTodayIsoDate } from "@/lib/calendar";

export interface MonthlySummary {
  totalSpent: number;
  totalIncome: number;
  totalInvestmentTransfers: number;
  monthlyNetFlow: number;
  monthToDateNetFlow: number | null;
  trackedBalance: number | null;
  balanceTrackingStatus: "tracked" | "untracked" | "future" | "unavailable";
  balanceCheckpointDate: string | null;
  balanceCheckpoint: MonthSnapshot["balance"]["checkpoint"];
  balanceAsOfDate: string | null;
  totalBudget: number;
  assignedCategoryBudgetTotal: number;
  allocationPercent: number | null;
  incomeAmount: number | null;
  expenseCount: number;
  givingSpent: number;
  recentMovements: RecentMovement[];
  categoryBreakdown: {
    category_id: string;
    category_name: string;
    category_color: string;
    category_icon: string;
    total_amount: number;
    expense_count: number;
  }[];
  dailySpending: { date: string; amount: number }[];
  previousMonthTotal: number;
}

const emptySummary: MonthlySummary = {
  totalSpent: 0,
  totalIncome: 0,
  totalInvestmentTransfers: 0,
  monthlyNetFlow: 0,
  monthToDateNetFlow: null,
  trackedBalance: null,
  balanceTrackingStatus: "unavailable",
  balanceCheckpointDate: null,
  balanceCheckpoint: null,
  balanceAsOfDate: null,
  totalBudget: 0,
  assignedCategoryBudgetTotal: 0,
  allocationPercent: null,
  incomeAmount: null,
  expenseCount: 0,
  givingSpent: 0,
  recentMovements: [],
  categoryBreakdown: [],
  dailySpending: [],
  previousMonthTotal: 0,
};

export function useMonthlySummary({ month, year }: { month: number; year: number }) {
  const { baseCurrency, convert, rates } = useCurrency();
  const asOfDate = getTodayIsoDate();
  const query = useMonthSnapshot({ month, year, asOfDate });

  const summary = useMemo<MonthlySummary>(() => {
    const snapshot = query.data;
    if (!snapshot) return emptySummary;

    const convertTotal = (
      field: keyof Omit<MonthSnapshot["currencyTotals"][number], "currency">
    ) =>
      snapshot.currencyTotals.reduce(
        (sum, row) => sum + convert(Number(row[field]), row.currency),
        0
      );
    const totalSpent = convertTotal("totalSpent");
    const totalIncome = convertTotal("totalIncome");
    const totalInvestmentTransfers = convertTotal("totalInvestmentTransfers");
    const monthToDateNetFlow =
      convertTotal("monthToDateIncome") -
      convertTotal("monthToDateSpent") -
      convertTotal("monthToDateInvestmentTransfers");

    const assignedCategoryBudgetTotal = snapshot.budgets.reduce(
      (sum, budget) => sum + convert(Number(budget.amount), budget.currency),
      0
    );
    const incomeAmount = snapshot.monthlyPlan
      ? convert(
          Number(snapshot.monthlyPlan.incomeAmount),
          snapshot.monthlyPlan.incomeCurrency
        )
      : null;
    const totalBudget = snapshot.monthlyPlan
      ? (incomeAmount ?? 0) *
        (Number(snapshot.monthlyPlan.allocationPercent) / 100)
      : assignedCategoryBudgetTotal;

    const categories = new Map<
      string,
      MonthlySummary["categoryBreakdown"][number]
    >();
    for (const row of snapshot.categoryAggregates) {
      const current = categories.get(row.categoryId);
      const amount = convert(Number(row.totalAmount), row.currency);
      if (current) {
        current.total_amount += amount;
        current.expense_count += Number(row.expenseCount);
      } else {
        categories.set(row.categoryId, {
          category_id: row.categoryId,
          category_name: row.categoryName,
          category_color: row.categoryColor,
          category_icon: row.categoryIcon,
          total_amount: amount,
          expense_count: Number(row.expenseCount),
        });
      }
    }

    const days = new Map<string, number>();
    for (const row of snapshot.dailyAggregates) {
      days.set(
        row.date,
        (days.get(row.date) ?? 0) + convert(Number(row.amount), row.currency)
      );
    }

    const balanceCurrencies = snapshot.balance.checkpoint
      ? [
          snapshot.balance.checkpoint.currency,
          ...snapshot.balance.movementTotals.incomes.map((row) => row.currency),
          ...snapshot.balance.movementTotals.expenses.map((row) => row.currency),
          ...snapshot.balance.movementTotals.investmentTransfers.map(
            (row) => row.currency
          ),
        ]
      : [];
    const canConvertBalance = balanceCurrencies.every(
      (currency) =>
        currency === baseCurrency ||
        (Boolean(rates[currency]) && Boolean(rates[baseCurrency]))
    );
    const trackedBalance = canConvertBalance
      ? calculateTrackedBalance({
          checkpoint: snapshot.balance.checkpoint,
          totals: snapshot.balance.movementTotals,
          convert,
        })
      : null;
    const balanceTrackingStatus =
      snapshot.balance.status === "tracked" && !canConvertBalance
        ? "unavailable"
        : snapshot.balance.status;

    return {
      totalSpent,
      totalIncome,
      totalInvestmentTransfers,
      monthlyNetFlow: totalIncome - totalSpent - totalInvestmentTransfers,
      monthToDateNetFlow,
      trackedBalance,
      balanceTrackingStatus,
      balanceCheckpointDate:
        snapshot.balance.checkpoint?.as_of_date ?? null,
      balanceCheckpoint: snapshot.balance.checkpoint,
      balanceAsOfDate: snapshot.balance.asOfDate,
      totalBudget,
      assignedCategoryBudgetTotal,
      allocationPercent: snapshot.monthlyPlan
        ? Number(snapshot.monthlyPlan.allocationPercent)
        : null,
      incomeAmount,
      expenseCount: snapshot.expenseCount,
      givingSpent: convertTotal("givingSpent"),
      recentMovements: snapshot.recentMovements,
      categoryBreakdown: [...categories.values()].sort(
        (a, b) => b.total_amount - a.total_amount
      ),
      dailySpending: [...days.entries()]
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      previousMonthTotal:
        convertTotal("previousSpent") +
        convertTotal("previousInvestmentTransfers"),
    };
  }, [baseCurrency, convert, query.data, rates]);

  return {
    summary,
    snapshot: query.data ?? null,
    loading: query.isPending,
    refetch: query.refetch,
  };
}
