import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMonthDateRange } from "@/lib/recurring-expenses";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import {
  isMissingTableError,
  logSuppressedSupabaseError,
} from "@/lib/supabase/postgrest-errors";

const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export async function GET(request: NextRequest) {
  const parsed = summaryQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid summary query" },
      { status: 400 }
    );
  }

  const { month, year } = parsed.data;
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;

  // Expenses and incomes live in the ledger project; budgets, plans,
  // and investment transfers remain in the app project.
  const ledger = ledgerSupabase ?? appSupabase;
  const ledgerUserId = ledgerUser?.id ?? user.id;

  const { startDate, endDate } = getMonthDateRange(month, year);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const { startDate: previousStartDate } = getMonthDateRange(
    previousMonth,
    previousYear
  );

  // Parallel queries — ledger for expenses/incomes, app for budgets/plans/transfers.
  // Recurring sync is intentionally off the read path (see POST /api/recurring/sync).
  const [
    expensesResult,
    incomesResult,
    prevExpensesResult,
    budgetsResult,
    monthlyPlanResult,
    investmentTransfersResult,
    prevInvestmentTransfersResult,
  ] = await Promise.all([
    ledger
      .from("expenses")
      .select(
        "id, amount, currency, date, description, needs_review, category_id, categories(id, name, color, icon, classification)"
      )
      .eq("user_id", ledgerUserId)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false }),
    ledger
      .from("income_entries")
      .select("id, amount, currency, date, source, description")
      .eq("user_id", ledgerUserId)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false }),
    ledger
      .from("expenses")
      .select("amount, currency")
      .eq("user_id", ledgerUserId)
      .gte("date", previousStartDate)
      .lt("date", startDate),
    appSupabase
      .from("budgets")
      .select("amount, currency")
      .eq("month", month)
      .eq("year", year),
    appSupabase
      .from("monthly_budget_plans")
      .select("income_amount, income_currency, allocation_percent")
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
    appSupabase
      .from("investment_savings_transfers")
      .select("amount, currency, transfer_date")
      .gte("transfer_date", startDate)
      .lt("transfer_date", endDate),
    appSupabase
      .from("investment_savings_transfers")
      .select("amount, currency")
      .gte("transfer_date", previousStartDate)
      .lt("transfer_date", startDate),
  ]);

  if (expensesResult.error) {
    console.error("Failed to fetch expenses for summary", expensesResult.error);
    return NextResponse.json(
      { error: "Unable to fetch expenses" },
      { status: 500 }
    );
  }

  if (budgetsResult.error) {
    console.error("Failed to fetch budgets for summary", budgetsResult.error);
    return NextResponse.json(
      { error: "Unable to fetch budgets" },
      { status: 500 }
    );
  }

  if (prevExpensesResult.error) {
    console.error(
      "Failed to fetch previous expenses for summary",
      prevExpensesResult.error
    );
    return NextResponse.json(
      { error: "Unable to fetch previous expenses" },
      { status: 500 }
    );
  }

  // Resolve optional tables gracefully
  function resolveOptional<T>(
    result: {
      data: T | null;
      error: { code?: string | null; message?: string | null } | null;
    },
    table: string,
    context: string,
    fallback: T
  ): T {
    if (!result.error) {
      return result.data ?? fallback;
    }
    if (isMissingTableError(result.error, table)) {
      logSuppressedSupabaseError(context, result.error);
      return fallback;
    }
    throw result.error;
  }

  const expenses = expensesResult.data ?? [];
  const prevExpenses = prevExpensesResult.data ?? [];
  const budgets = budgetsResult.data ?? [];

  let incomes: {
    id: string;
    amount: unknown;
    currency: string;
    date: string;
    source: string;
    description: string | null;
  }[];
  try {
    incomes = resolveOptional(
      incomesResult,
      "income_entries",
      "Income entries unavailable during dashboard summary",
      []
    );
  } catch {
    incomes = [];
  }

  let monthlyPlan: {
    income_amount: unknown;
    income_currency: string;
    allocation_percent: unknown;
  } | null;
  try {
    monthlyPlan = resolveOptional(
      monthlyPlanResult,
      "monthly_budget_plans",
      "Monthly budget plans unavailable during dashboard summary",
      null
    );
  } catch {
    monthlyPlan = null;
  }

  let investmentTransfers: {
    amount: unknown;
    currency: string;
    transfer_date: string;
  }[];
  try {
    investmentTransfers = resolveOptional(
      investmentTransfersResult,
      "investment_savings_transfers",
      "Investment transfers unavailable during dashboard summary",
      []
    );
  } catch {
    investmentTransfers = [];
  }

  let prevInvestmentTransfers: { amount: unknown; currency: string }[];
  try {
    prevInvestmentTransfers = resolveOptional(
      prevInvestmentTransfersResult,
      "investment_savings_transfers",
      "Previous investment transfers unavailable during dashboard summary",
      []
    );
  } catch {
    prevInvestmentTransfers = [];
  }

  // Return raw rows — currency conversion happens on the client
  // No HTTP cache: the client-side react-query cache owns freshness.
  return NextResponse.json({
    expenses,
    incomes,
    prevExpenses,
    budgets,
    monthlyPlan,
    investmentTransfers,
    prevInvestmentTransfers,
  });
}
