"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlySummaryRaw } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import { useCurrency } from "@/providers/currency-provider";

interface MonthlySummary {
  totalSpent: number;
  totalIncome: number;
  totalInvestmentTransfers: number;
  availableBalance: number;
  totalBudget: number;
  assignedCategoryBudgetTotal: number;
  allocationPercent: number | null;
  incomeAmount: number | null;
  expenseCount: number;
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
  availableBalance: 0,
  totalBudget: 0,
  assignedCategoryBudgetTotal: 0,
  allocationPercent: null,
  incomeAmount: null,
  expenseCount: 0,
  categoryBreakdown: [],
  dailySpending: [],
  previousMonthTotal: 0,
};

export function useMonthlySummary({ month, year }: UseMonthlySummaryOptions) {
  const { convert } = useCurrency();

  const {
    data: rawData,
    isPending,
    refetch,
  } = useQuery({
    queryKey: queryKeys.monthlySummary(month, year),
    queryFn: () => fetchMonthlySummaryRaw(month, year),
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
    const availableBalance =
      totalIncome - totalSpent - totalInvestmentTransfers;
    const previousMonthTotal =
      prevExpenses.reduce(
        (sum, e) => sum + convert(Number(e.amount), e.currency),
        0
      ) +
      prevInvestmentTransfers.reduce(
        (sum, t) => sum + convert(Number(t.amount), t.currency),
        0
      );

    const categoryMap = new Map<
      string,
      MonthlySummary["categoryBreakdown"][0]
    >();
    for (const expense of expenses) {
      const category = expense.categories;
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

    return {
      totalSpent,
      totalIncome,
      totalInvestmentTransfers,
      availableBalance,
      totalBudget,
      assignedCategoryBudgetTotal,
      allocationPercent: monthlyPlan
        ? Number(monthlyPlan.allocation_percent)
        : null,
      incomeAmount,
      expenseCount: expenses.length + investmentTransfers.length,
      categoryBreakdown: Array.from(categoryMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      ),
      dailySpending,
      previousMonthTotal,
    };
  }, [rawData, convert]);

  return { summary, loading: isPending, refetch };
}
