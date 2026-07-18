import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format, isValid, parseISO, subDays } from "date-fns";
import { getMonthDateRange } from "@/lib/recurring-expenses";
import {
  aggregateBalanceMovements,
  isMovementAfterCheckpoint,
  type BalanceCheckpointRecord,
  type BalanceMovement,
  type BalanceMovementTotals,
} from "@/lib/balance-checkpoint";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import {
  isMissingTableError,
  logSuppressedSupabaseError,
} from "@/lib/supabase/postgrest-errors";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => isValid(parseISO(value)), "Invalid date");

const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  asOf: isoDateSchema.optional(),
});

export async function GET(request: NextRequest) {
  const parsed = summaryQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
    asOf: request.nextUrl.searchParams.get("asOf") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid summary query" },
      { status: 400 }
    );
  }

  const { month, year } = parsed.data;
  const requestedAsOfDate =
    parsed.data.asOf ?? format(new Date(), "yyyy-MM-dd");
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appUserId = user.id;

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;

  // Expenses and incomes live in the ledger project; budgets, plans,
  // and investment transfers remain in the app project.
  const ledger = ledgerSupabase ?? appSupabase;
  const ledgerUserId = ledgerUser?.id ?? user.id;

  const { startDate, endDate } = getMonthDateRange(month, year);
  const periodEndDate = format(subDays(parseISO(endDate), 1), "yyyy-MM-dd");
  const isFuturePeriod = startDate > requestedAsOfDate;
  const isCurrentPeriod =
    startDate <= requestedAsOfDate && endDate > requestedAsOfDate;
  const balanceTargetDate =
    periodEndDate < requestedAsOfDate ? periodEndDate : requestedAsOfDate;
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const { startDate: previousStartDate } = getMonthDateRange(
    previousMonth,
    previousYear
  );

  // Parallel queries — ledger for expenses/incomes, app for budgets/plans/transfers.
  // Recurring sync is intentionally off the read path (see POST /api/recurring/sync).
  const checkpointPromise = isFuturePeriod
    ? Promise.resolve({ data: null, error: null })
    : appSupabase
        .from("balance_checkpoints")
        .select(
          "balance, currency, as_of_date, created_at, calculated_balance_before, reconciliation_delta, calculation_start_date, calculation_basis"
        )
        .lte("as_of_date", balanceTargetDate)
        .order("as_of_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  const [
    [
      expensesResult,
      incomesResult,
      prevExpensesResult,
      budgetsResult,
      monthlyPlanResult,
      investmentTransfersResult,
      prevInvestmentTransfersResult,
    ],
    checkpointResult,
  ] = await Promise.all([
    Promise.all([
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
    ]),
    checkpointPromise,
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

  type BalanceTrackingStatus =
    | "tracked"
    | "untracked"
    | "future"
    | "unavailable";

  let balanceTrackingStatus: BalanceTrackingStatus = isFuturePeriod
    ? "future"
    : "untracked";
  let balanceCheckpoint: BalanceCheckpointRecord | null = null;
  let balanceAsOfDate: string | null = null;
  let balanceMovementTotals: BalanceMovementTotals = {
    incomes: [],
    expenses: [],
    investmentTransfers: [],
  };
  let monthToDateMovementTotals: BalanceMovementTotals | null = null;

  const pageSize = 1_000;

  async function fetchAllBalanceExpenses(fromDate: string) {
    const rows: BalanceMovement[] = [];
    for (let from = 0; ; from += pageSize) {
      const result = await ledger
        .from("expenses")
        .select("id, amount, currency, date, created_at")
        .eq("user_id", ledgerUserId)
        .gte("date", fromDate)
        .lte("date", balanceTargetDate)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (result.error) return { rows: null, error: result.error };
      const page = (result.data ?? []) as BalanceMovement[];
      rows.push(...page);
      if (page.length < pageSize) return { rows, error: null };
    }
  }

  async function fetchAllBalanceIncomes(fromDate: string) {
    const rows: BalanceMovement[] = [];
    for (let from = 0; ; from += pageSize) {
      const result = await ledger
        .from("income_entries")
        .select("id, amount, currency, date, created_at")
        .eq("user_id", ledgerUserId)
        .gte("date", fromDate)
        .lte("date", balanceTargetDate)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (result.error) return { rows: null, error: result.error };
      const page = (result.data ?? []) as BalanceMovement[];
      rows.push(...page);
      if (page.length < pageSize) return { rows, error: null };
    }
  }

  async function fetchAllBalanceTransfers(fromDate: string) {
    const rows: BalanceMovement[] = [];
    for (let from = 0; ; from += pageSize) {
      const result = await appSupabase
        .from("investment_savings_transfers")
        .select("id, amount, currency, transfer_date, created_at")
        .eq("user_id", appUserId)
        .gte("transfer_date", fromDate)
        .lte("transfer_date", balanceTargetDate)
        .order("transfer_date", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (result.error) return { rows: null, error: result.error };
      const page = (result.data ?? []).map((row) => ({
        amount: row.amount,
        currency: row.currency,
        date: row.transfer_date,
        created_at: row.created_at,
      }));
      rows.push(...page);
      if (page.length < pageSize) return { rows, error: null };
    }
  }

  async function fetchMovementTotals(fromDate: string) {
    const [balanceExpenses, balanceIncomes, balanceTransfers] =
      await Promise.all([
        fetchAllBalanceExpenses(fromDate),
        fetchAllBalanceIncomes(fromDate),
        fetchAllBalanceTransfers(fromDate),
      ]);

    const error =
      balanceExpenses.error ?? balanceIncomes.error ?? balanceTransfers.error;

    return {
      rows: error
        ? null
        : {
            expenses: balanceExpenses.rows!,
            incomes: balanceIncomes.rows!,
            investmentTransfers: balanceTransfers.rows!,
          },
      error,
    };
  }

  if (!isFuturePeriod) {
    if (checkpointResult.error) {
      balanceTrackingStatus = "unavailable";
      logSuppressedSupabaseError(
        "Balance checkpoints unavailable during dashboard summary",
        checkpointResult.error
      );
    } else if (checkpointResult.data) {
      balanceCheckpoint = checkpointResult.data as BalanceCheckpointRecord;
      const checkpointMovements = await fetchMovementTotals(
        balanceCheckpoint.as_of_date
      );

      if (checkpointMovements.error) {
        balanceTrackingStatus = "unavailable";
        balanceCheckpoint = null;
        logSuppressedSupabaseError(
          "Post-checkpoint movements unavailable during dashboard summary",
          checkpointMovements.error
        );
      } else {
        const afterCheckpoint = (row: BalanceMovement) =>
          isMovementAfterCheckpoint(row, balanceCheckpoint!);
        balanceMovementTotals = {
          incomes: aggregateBalanceMovements(
            checkpointMovements.rows!.incomes.filter(afterCheckpoint)
          ),
          expenses: aggregateBalanceMovements(
            checkpointMovements.rows!.expenses.filter(afterCheckpoint)
          ),
          investmentTransfers: aggregateBalanceMovements(
            checkpointMovements.rows!.investmentTransfers.filter(
              afterCheckpoint
            )
          ),
        };
        balanceTrackingStatus = "tracked";
        balanceAsOfDate = balanceTargetDate;
      }
    } else if (isCurrentPeriod) {
      const monthToDateMovements = await fetchMovementTotals(startDate);

      if (monthToDateMovements.error) {
        balanceTrackingStatus = "unavailable";
        logSuppressedSupabaseError(
          "Month-to-date movements unavailable during dashboard summary",
          monthToDateMovements.error
        );
      } else {
        monthToDateMovementTotals = {
          incomes: aggregateBalanceMovements(
            monthToDateMovements.rows!.incomes
          ),
          expenses: aggregateBalanceMovements(
            monthToDateMovements.rows!.expenses
          ),
          investmentTransfers: aggregateBalanceMovements(
            monthToDateMovements.rows!.investmentTransfers
          ),
        };
      }
    }
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
    balanceTrackingStatus,
    balanceCheckpoint,
    balanceAsOfDate,
    balanceMovementTotals,
    monthToDateMovementTotals,
  });
}
