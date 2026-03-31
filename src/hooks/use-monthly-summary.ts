"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MonthlySummary {
  totalSpent: number;
  totalBudget: number;
  expenseCount: number;
  categoryBreakdown: {
    category_id: string;
    category_name: string;
    category_color: string;
    category_icon: string;
    total_amount: number;
    expense_count: number;
    currency: string;
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
    expenseCount: 0,
    categoryBreakdown: [],
    dailySpending: [],
    previousMonthTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // Fetch current month expenses with categories
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, categories(*)")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date");

    // Fetch budgets for current month
    const { data: budgets } = await supabase
      .from("budgets")
      .select("amount, currency")
      .eq("month", month)
      .eq("year", year);

    // Fetch previous month total
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const { data: prevExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .gte("date", prevStartDate)
      .lt("date", startDate);

    const totalSpent =
      expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
    const totalBudget =
      budgets?.reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
    const previousMonthTotal =
      prevExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    // Category breakdown
    const categoryMap = new Map<
      string,
      MonthlySummary["categoryBreakdown"][0]
    >();
    expenses?.forEach((e) => {
      const cat = e.categories as {
        id: string;
        name: string;
        color: string;
        icon: string;
      };
      const existing = categoryMap.get(cat.id);
      if (existing) {
        existing.total_amount += Number(e.amount);
        existing.expense_count += 1;
      } else {
        categoryMap.set(cat.id, {
          category_id: cat.id,
          category_name: cat.name,
          category_color: cat.color,
          category_icon: cat.icon,
          total_amount: Number(e.amount),
          expense_count: 1,
          currency: e.currency,
        });
      }
    });

    // Daily spending
    const dailyMap = new Map<string, number>();
    expenses?.forEach((e) => {
      const existing = dailyMap.get(e.date) ?? 0;
      dailyMap.set(e.date, existing + Number(e.amount));
    });
    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setSummary({
      totalSpent,
      totalBudget,
      expenseCount: expenses?.length ?? 0,
      categoryBreakdown: Array.from(categoryMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      ),
      dailySpending,
      previousMonthTotal,
    });
    setLoading(false);
  }, [supabase, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
}
