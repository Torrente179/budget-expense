"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  fetchMonthlySummaryRaw,
  type RecentMovement,
} from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import { isGivingExpense } from "@/lib/giving";
import { useCurrency } from "@/providers/currency-provider";
import {
  calculateTrackedBalance,
  type BalanceCheckpointRecord,
  type BalanceMovementTotals,
} from "@/lib/balance-checkpoint";

export interface MonthlySummary {
  totalSpent: number;
  totalIncome: number;
  totalInvestmentTransfers: number;
  monthlyNetFlow: number;
  monthToDateNetFlow: number | null;
  trackedBalance: number | null;
  balanceTrackingStatus:
    | "tracked"
    | "untracked"
    | "future"
    | "unavailable";
  balanceCheckpointDate: string | null;
  balanceCheckpoint: BalanceCheckpointRecord | null;
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

interface UseMonthlySummaryOptions {
  month: number;
  year: number;
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

export function useMonthlySummary({ month, year }: UseMonthlySummaryOptions) {
  const { baseCurrency, convert, rates } = useCurrency();
  const asOfDate = format(new Date(), "yyyy-MM-dd");

  const {
    data: rawData,
    isPending,
    refetch,
  } = useQuery({
    queryKey: queryKeys.monthlySummary(month, year, asOfDate),
    queryFn: () => fetchMonthlySummaryRaw(month, year, asOfDate),
  });

  // Derive converted summary from raw data + convert — recomputes when rates
  // change without triggering a new API fetch
  const summary = useMemo<MonthlySummary>(() => {
    if (!rawData) return emptySummary;

    const {
      expenses,
      incomes,
      prevExpenses,
      budgets,
      monthlyPlan,
      investmentTransfers,
      prevInvestmentTransfers,
      balanceTrackingStatus,
      balanceCheckpoint,
      balanceAsOfDate,
      balanceMovementTotals,
      monthToDateMovementTotals,
    } = rawData;

    const totalSpent = expenses.reduce(
      (sum, e) => sum + convert(Number(e.amount), e.currency),
      0
    );
    const totalIncome = incomes.reduce(
      (sum, i) => sum + convert(Number(i.amount), i.currency),
      0
    );
    const totalInvestmentTransfers = investmentTransfers.reduce(
      (sum, t) => sum + convert(Number(t.amount), t.currency),
      0
    );
    const assignedCategoryBudgetTotal = budgets.reduce(
      (sum, b) => sum + convert(Number(b.amount), b.currency),
      0
    );
    const incomeAmount = monthlyPlan
      ? convert(
          Number(monthlyPlan.income_amount),
          monthlyPlan.income_currency
        )
      : null;
    const totalBudget = monthlyPlan
      ? incomeAmount! * (Number(monthlyPlan.allocation_percent) / 100)
      : assignedCategoryBudgetTotal;
    const monthlyNetFlow =
      totalIncome - totalSpent - totalInvestmentTransfers;
    const canConvertCurrency = (currency: string) =>
      currency === baseCurrency ||
      (Boolean(rates[currency]) && Boolean(rates[baseCurrency]));
    const sumConverted = (
      rows: BalanceMovementTotals["incomes"]
    ) =>
      rows.reduce(
        (sum, row) => sum + convert(Number(row.amount), row.currency),
        0
      );
    const monthToDateCurrencies = monthToDateMovementTotals
      ? [
          ...monthToDateMovementTotals.incomes.map((row) => row.currency),
          ...monthToDateMovementTotals.expenses.map((row) => row.currency),
          ...monthToDateMovementTotals.investmentTransfers.map(
            (row) => row.currency
          ),
        ]
      : [];
    const canConvertMonthToDate = monthToDateCurrencies.every(
      canConvertCurrency
    );
    const monthToDateNetFlow =
      monthToDateMovementTotals && canConvertMonthToDate
        ? sumConverted(monthToDateMovementTotals.incomes) -
          sumConverted(monthToDateMovementTotals.expenses) -
          sumConverted(monthToDateMovementTotals.investmentTransfers)
        : null;
    const balanceCurrencies = balanceCheckpoint
      ? [
          balanceCheckpoint.currency,
          ...balanceMovementTotals.incomes.map((row) => row.currency),
          ...balanceMovementTotals.expenses.map((row) => row.currency),
          ...balanceMovementTotals.investmentTransfers.map(
            (row) => row.currency
          ),
        ]
      : [];
    const canConvertTrackedBalance =
      balanceCurrencies.every(canConvertCurrency);
    const trackedBalance =
      balanceTrackingStatus === "tracked" && canConvertTrackedBalance
        ? calculateTrackedBalance({
            checkpoint: balanceCheckpoint,
            totals: balanceMovementTotals,
            convert,
          })
        : null;
    const resolvedBalanceTrackingStatus =
      balanceTrackingStatus === "tracked" && !canConvertTrackedBalance
        ? ("unavailable" as const)
        : balanceTrackingStatus;
    const previousMonthTotal =
      prevExpenses.reduce(
        (sum, e) => sum + convert(Number(e.amount), e.currency),
        0
      ) +
      prevInvestmentTransfers.reduce(
        (sum, t) => sum + convert(Number(t.amount), t.currency),
        0
      );

    const givingSpent = expenses.reduce((sum, expense) => {
      if (!isGivingExpense(expense)) return sum;
      return sum + convert(Number(expense.amount), expense.currency);
    }, 0);

    const categoryMap = new Map<
      string,
      MonthlySummary["categoryBreakdown"][0]
    >();
    for (const expense of expenses) {
      const category = expense.categories;
      if (!category) continue;
      const convertedAmount = convert(Number(expense.amount), expense.currency);
      const existing = categoryMap.get(category.id);

      if (existing) {
        existing.total_amount += convertedAmount;
        existing.expense_count += 1;
      } else {
        categoryMap.set(category.id, {
          category_id: category.id,
          category_name: category.name,
          category_color: category.color,
          category_icon: category.icon,
          total_amount: convertedAmount,
          expense_count: 1,
        });
      }
    }

    const dailyMap = new Map<string, number>();
    for (const expense of expenses) {
      const existing = dailyMap.get(expense.date) ?? 0;
      dailyMap.set(
        expense.date,
        existing + convert(Number(expense.amount), expense.currency)
      );
    }
    for (const transfer of investmentTransfers) {
      const existing = dailyMap.get(transfer.transfer_date) ?? 0;
      dailyMap.set(
        transfer.transfer_date,
        existing + convert(Number(transfer.amount), transfer.currency)
      );
    }
    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const expenseItems: RecentMovement[] = expenses.map((expense) => ({
      id: expense.id,
      kind: "expense" as const,
      title: expense.description || expense.categories?.name || "—",
      subtitle: expense.categories?.name || "—",
      amount: Number(expense.amount),
      currency: expense.currency,
      date: expense.date,
      category: expense.categories
        ? { icon: expense.categories.icon, color: expense.categories.color }
        : null,
      needsReview: expense.needs_review,
    }));
    const incomeItems: RecentMovement[] = incomes.map((income) => ({
      id: income.id,
      kind: "income" as const,
      title: income.source,
      subtitle: income.description || "Income",
      amount: Number(income.amount),
      currency: income.currency,
      date: income.date,
      category: null,
      needsReview: false,
    }));
    const recentMovements = [...expenseItems, ...incomeItems]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      totalSpent,
      totalIncome,
      totalInvestmentTransfers,
      monthlyNetFlow,
      monthToDateNetFlow,
      trackedBalance,
      balanceTrackingStatus: resolvedBalanceTrackingStatus,
      balanceCheckpointDate: balanceCheckpoint?.as_of_date ?? null,
      balanceCheckpoint,
      balanceAsOfDate,
      totalBudget,
      assignedCategoryBudgetTotal,
      allocationPercent: monthlyPlan
        ? Number(monthlyPlan.allocation_percent)
        : null,
      incomeAmount,
      expenseCount: expenses.length + investmentTransfers.length,
      givingSpent,
      recentMovements,
      categoryBreakdown: Array.from(categoryMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      ),
      dailySpending,
      previousMonthTotal,
    };
  }, [rawData, baseCurrency, convert, rates]);

  return { summary, loading: isPending, refetch };
}
