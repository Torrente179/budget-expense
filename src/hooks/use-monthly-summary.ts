"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [summary, setSummary] = useState<MonthlySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { convert } = useCurrency();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });

      const response = await fetch(
        `/api/dashboard/summary?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Dashboard summary fetch failed with status ${response.status}`
        );
      }

      const data = await response.json();

      const expenses: {
        amount: unknown;
        currency: string;
        date: string;
        category_id: string;
        categories: {
          id: string;
          name: string;
          color: string;
          icon: string;
        };
      }[] = data.expenses ?? [];

      const incomes: { amount: unknown; currency: string }[] =
        data.incomes ?? [];
      const prevExpenses: { amount: unknown; currency: string }[] =
        data.prevExpenses ?? [];
      const budgets: { amount: unknown; currency: string }[] =
        data.budgets ?? [];
      const monthlyPlan: {
        income_amount: unknown;
        income_currency: string;
        allocation_percent: unknown;
      } | null = data.monthlyPlan ?? null;
      const investmentTransfers: {
        amount: unknown;
        currency: string;
        transfer_date: string;
      }[] = data.investmentTransfers ?? [];
      const prevInvestmentTransfers: {
        amount: unknown;
        currency: string;
      }[] = data.prevInvestmentTransfers ?? [];

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

      setSummary({
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
      });
    } catch (error) {
      console.error("Failed to fetch monthly summary", error);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }, [convert, supabase, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
}
