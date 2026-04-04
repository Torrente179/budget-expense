"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMonthDateRange,
  syncRecurringExpensesForMonth,
} from "@/lib/recurring-expenses";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
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

export function useMonthlySummary({ month, year }: UseMonthlySummaryOptions) {
  const [summary, setSummary] = useState<MonthlySummary>({
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
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { convert } = useCurrency();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthDateRange(month, year);
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;
      const { startDate: previousStartDate } = getMonthDateRange(
        previousMonth,
        previousYear
      );

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        try {
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
        } catch (error) {
          console.error("Failed to sync recurring expenses before loading summary", error);
        }
      }

      const [
        expensesResult,
        incomesResult,
        budgetsResult,
        monthlyPlanResult,
        prevExpensesResult,
        investmentTransfersResult,
        prevInvestmentTransfersResult,
      ] = await Promise.all([
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
        supabase
          .from("investment_savings_transfers")
          .select("amount, currency, transfer_date")
          .gte("transfer_date", startDate)
          .lt("transfer_date", endDate),
        supabase
          .from("investment_savings_transfers")
          .select("amount, currency")
          .gte("transfer_date", previousStartDate)
          .lt("transfer_date", startDate),
      ]);

      if (expensesResult.error) {
        throw expensesResult.error;
      }

      if (budgetsResult.error) {
        throw budgetsResult.error;
      }

      if (prevExpensesResult.error) {
        throw prevExpensesResult.error;
      }

      const expenses = expensesResult.data ?? [];
      const budgets = budgetsResult.data ?? [];
      const prevExpenses = prevExpensesResult.data ?? [];
      const incomes = resolveOptionalTableResult(incomesResult, {
        table: "income_entries",
        context: "Income entries table is unavailable during monthly summary fetch",
        fallback: [],
      });
      const monthlyPlan = resolveOptionalTableResult(monthlyPlanResult, {
        table: "monthly_budget_plans",
        context: "Monthly budget plans table is unavailable during monthly summary fetch",
        fallback: null,
      });
      const investmentTransfers = resolveOptionalTableResult(
        investmentTransfersResult,
        {
          table: "investment_savings_transfers",
          context:
            "Investment savings transfers table is unavailable during monthly summary fetch",
          fallback: [],
        }
      );
      const prevInvestmentTransfers = resolveOptionalTableResult(
        prevInvestmentTransfersResult,
        {
          table: "investment_savings_transfers",
          context:
            "Investment savings transfers table is unavailable during previous-month summary fetch",
          fallback: [],
        }
      );

      const totalSpent =
        expenses.reduce(
        (sum, expense) => sum + convert(Number(expense.amount), expense.currency),
        0
        ) ?? 0;
      const totalIncome =
        incomes.reduce(
        (sum, income) => sum + convert(Number(income.amount), income.currency),
        0
        ) ?? 0;
      const totalInvestmentTransfers =
        investmentTransfers.reduce(
        (sum, transfer) =>
          sum + convert(Number(transfer.amount), transfer.currency),
        0
        ) ?? 0;
      const assignedCategoryBudgetTotal =
        budgets.reduce(
        (sum, budget) => sum + convert(Number(budget.amount), budget.currency),
        0
        ) ?? 0;
      const incomeAmount = monthlyPlan
        ? convert(Number(monthlyPlan.income_amount), monthlyPlan.income_currency)
        : null;
      const totalBudget = monthlyPlan
        ? incomeAmount! * (Number(monthlyPlan.allocation_percent) / 100)
        : assignedCategoryBudgetTotal;
      const availableBalance =
        totalIncome - totalSpent - totalInvestmentTransfers;
      const previousMonthTotal =
        (prevExpenses.reduce(
        (sum, expense) => sum + convert(Number(expense.amount), expense.currency),
        0
        ) ?? 0) +
        (prevInvestmentTransfers.reduce(
        (sum, transfer) => sum + convert(Number(transfer.amount), transfer.currency),
        0
        ) ?? 0);

      const categoryMap = new Map<string, MonthlySummary["categoryBreakdown"][0]>();
      expenses.forEach((expense) => {
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
      expenses.forEach((expense) => {
      const existing = dailyMap.get(expense.date) ?? 0;
      dailyMap.set(
        expense.date,
        existing + convert(Number(expense.amount), expense.currency)
      );
      });
      investmentTransfers.forEach((transfer) => {
      const existing = dailyMap.get(transfer.transfer_date) ?? 0;
      dailyMap.set(
        transfer.transfer_date,
        existing + convert(Number(transfer.amount), transfer.currency)
      );
      });
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
      setSummary({
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
      });
    } finally {
      setLoading(false);
    }
  }, [convert, supabase, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
}
