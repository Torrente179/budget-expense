"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/providers/currency-provider";

interface MonthlySummary {
  totalSpent: number;
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
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const [{ data: expenses }, { data: budgets }, { data: monthlyPlan }, { data: prevExpenses }] =
      await Promise.all([
        supabase
          .from("expenses")
          .select("amount, currency, date, category_id, categories(*)")
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
          .gte("date", `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}-01`)
          .lt("date", startDate),
      ]);

    const totalSpent =
      expenses?.reduce(
        (sum, expense) => sum + convert(Number(expense.amount), expense.currency),
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
