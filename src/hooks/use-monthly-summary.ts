"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMonthDateRange,
  syncRecurringExpensesForMonth,
} from "@/lib/recurring-expenses";
import { useCurrency } from "@/providers/currency-provider";

interface MonthlySummary {
  totalSpent: number;
  totalIncome: number;
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

export function useMonthlySummary({ month, year }: UseMonthlySummaryOptions) {
  const [summary, setSummary] = useState<MonthlySummary>({
    totalSpent: 0,
    totalIncome: 0,
    availableBalance: 0,
    totalBudget: 0,
    assignedCategoryBudgetTotal: 0,
    allocationPercent: null,
    incomeAmount: null,
    expenseCount: 0,
    categoryBreakdown: [],
    dailySpending: [],
    previousMonthTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { convert } = useCurrency();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getMonthDateRange(month, year);
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const { startDate: previousStartDate } = getMonthDateRange(
      previousMonth,
      previousYear
    );

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await Promise.all([
        syncRecurringExpensesForMonth({
          supabase,
          userId: userData.user.id,
          month,
          year,
        }),
        syncRecurringExpensesForMonth({
          supabase,
          userId: userData.user.id,
          month: previousMonth,
          year: previousYear,
        }),
      ]);
    }

    const [
      { data: expenses },
      { data: incomes },
      { data: budgets },
      { data: monthlyPlan },
      { data: prevExpenses },
    ] =
      await Promise.all([
        supabase
          .from("expenses")
          .select("amount, currency, date, category_id, categories(*)")
          .gte("date", startDate)
          .lt("date", endDate)
          .order("date"),
        supabase
          .from("income_entries")
          .select("amount, currency, date")
          .gte("date", startDate)
          .lt("date", endDate)
          .order("date"),
        supabase
          .from("budgets")
          .select("amount, currency")
          .eq("month", month)
          .eq("year", year),
        supabase
          .from("monthly_budget_plans")
          .select("income_amount, income_currency, allocation_percent")
          .eq("month", month)
          .eq("year", year)
          .maybeSingle(),
        supabase
          .from("expenses")
          .select("amount, currency")
          .gte("date", previousStartDate)
          .lt("date", startDate),
      ]);

    const totalSpent =
      expenses?.reduce(
        (sum, expense) => sum + convert(Number(expense.amount), expense.currency),
        0
      ) ?? 0;
    const totalIncome =
      incomes?.reduce(
        (sum, income) => sum + convert(Number(income.amount), income.currency),
        0
      ) ?? 0;
    const assignedCategoryBudgetTotal =
      budgets?.reduce(
        (sum, budget) => sum + convert(Number(budget.amount), budget.currency),
        0
      ) ?? 0;
    const incomeAmount = monthlyPlan
      ? convert(Number(monthlyPlan.income_amount), monthlyPlan.income_currency)
      : null;
    const totalBudget = monthlyPlan
      ? incomeAmount! * (Number(monthlyPlan.allocation_percent) / 100)
      : assignedCategoryBudgetTotal;
    const availableBalance = totalIncome - totalSpent;
    const previousMonthTotal =
      prevExpenses?.reduce(
        (sum, expense) => sum + convert(Number(expense.amount), expense.currency),
        0
      ) ?? 0;

    const categoryMap = new Map<string, MonthlySummary["categoryBreakdown"][0]>();
    expenses?.forEach((expense) => {
      const category = expense.categories as {
        id: string;
        name: string;
        color: string;
        icon: string;
      };
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
    });

    const dailyMap = new Map<string, number>();
    expenses?.forEach((expense) => {
      const existing = dailyMap.get(expense.date) ?? 0;
      dailyMap.set(
        expense.date,
        existing + convert(Number(expense.amount), expense.currency)
      );
    });
    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setSummary({
      totalSpent,
      totalIncome,
      availableBalance,
      totalBudget,
      assignedCategoryBudgetTotal,
      allocationPercent: monthlyPlan
        ? Number(monthlyPlan.allocation_percent)
        : null,
      incomeAmount,
      expenseCount: expenses?.length ?? 0,
      categoryBreakdown: Array.from(categoryMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      ),
      dailySpending,
      previousMonthTotal,
    });
    setLoading(false);
  }, [convert, supabase, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
}
