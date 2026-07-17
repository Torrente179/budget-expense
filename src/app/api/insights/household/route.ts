import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";

/**
 * Trailing-12-month household aggregates for the stewardship metrics.
 *
 * Prefers SQL RPCs (household_*_aggregates). Falls back to paginated row
 * scans when the migration has not been applied yet.
 */

const GIVING_NAME_KEYWORDS = [
  "tithe",
  "diezmo",
  "giving",
  "donation",
  "donaci",
  "charity",
  "caridad",
  "offering",
  "ofrenda",
  "church",
  "iglesia",
  "generosity",
  "generosidad",
];

type Bucket = "giving" | "essential" | "discretionary" | "savings";

interface ExpenseAggregate {
  month: string;
  bucket: Bucket;
  currency: string;
  total: number;
  count: number;
}

interface IncomeAggregate {
  month: string;
  currency: string;
  total: number;
}

interface CategoryAggregate {
  month: string;
  categoryId: string;
  categoryName: string;
  currency: string;
  total: number;
  count: number;
}

function resolveBucket(category: {
  name?: string | null;
  classification?: string | null;
}): Bucket {
  const classification = category.classification;
  if (
    classification === "giving" ||
    classification === "essential" ||
    classification === "savings"
  ) {
    return classification;
  }
  const name = (category.name ?? "").toLowerCase();
  if (GIVING_NAME_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "giving";
  }
  return "discretionary";
}

function monthsAgoIso(months: number): string {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

function isMissingRpcError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    message.includes("could not find the function") ||
    message.includes("does not exist")
  );
}

export async function GET(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;
  const ledger = ledgerSupabase ?? appSupabase;
  const ledgerUserId = ledgerUser?.id ?? user.id;

  const startDate = monthsAgoIso(11);

  let expenseAggregates: ExpenseAggregate[] = [];
  let incomeAggregates: IncomeAggregate[] = [];
  let categoryAggregates: CategoryAggregate[] = [];

  const [expenseRpc, incomeRpc] = await Promise.all([
    ledger.rpc("household_expense_category_aggregates", {
      p_user_id: ledgerUserId,
      p_start_date: startDate,
    }),
    ledger.rpc("household_income_aggregates", {
      p_user_id: ledgerUserId,
      p_start_date: startDate,
    }),
  ]);

  if (!expenseRpc.error && !incomeRpc.error) {
    const bucketMap = new Map<string, ExpenseAggregate>();
    const categoryMap = new Map<string, CategoryAggregate>();

    for (const row of expenseRpc.data ?? []) {
      const month = String(row.month);
      const currency = String(row.currency);
      const categoryId = String(row.category_id);
      const categoryName = String(row.category_name ?? "—");
      const total = Number(row.total);
      const count = Number(row.expense_count);
      const bucket = resolveBucket({
        name: categoryName,
        classification: row.classification,
      });

      const bucketKey = `${month}|${bucket}|${currency}`;
      const existingBucket = bucketMap.get(bucketKey);
      if (existingBucket) {
        existingBucket.total += total;
        existingBucket.count += count;
      } else {
        bucketMap.set(bucketKey, { month, bucket, currency, total, count });
      }

      const categoryKey = `${month}|${categoryId}|${currency}`;
      const existingCategory = categoryMap.get(categoryKey);
      if (existingCategory) {
        existingCategory.total += total;
        existingCategory.count += count;
      } else {
        categoryMap.set(categoryKey, {
          month,
          categoryId,
          categoryName,
          currency,
          total,
          count,
        });
      }
    }

    expenseAggregates = [...bucketMap.values()];
    categoryAggregates = [...categoryMap.values()];
    incomeAggregates = (incomeRpc.data ?? []).map((row) => ({
      month: String(row.month),
      currency: String(row.currency),
      total: Number(row.total),
    }));
  } else if (
    isMissingRpcError(expenseRpc.error) ||
    isMissingRpcError(incomeRpc.error)
  ) {
    // Migration not applied yet — paginated scan fallback.
    const fallback = await fetchAggregatesFromRows(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ledger as any,
      ledgerUserId,
      startDate
    );
    if ("error" in fallback) {
      return NextResponse.json(fallback, { status: 500 });
    }
    expenseAggregates = fallback.expenses;
    incomeAggregates = fallback.incomes;
    categoryAggregates = fallback.categories;
  } else {
    return NextResponse.json(
      {
        error: "Failed to fetch household aggregates",
        details: expenseRpc.error?.message ?? incomeRpc.error?.message,
      },
      { status: 500 }
    );
  }

  let liabilities: {
    id: string;
    name: string;
    kind: string;
    currency: string;
    original_balance: number;
    interest_rate_percent: number | null;
    is_active: boolean;
    paid_total: number;
  }[] = [];
  let titheTargetPercent = 10;
  let settingsAvailable = true;

  const [liabilitiesResult, paymentTotalsRpc, paymentsResult, profileResult] =
    await Promise.all([
      appSupabase
        .from("liabilities")
        .select(
          "id, name, kind, currency, original_balance, interest_rate_percent, is_active"
        ),
      appSupabase.rpc("liability_payment_totals", { p_user_id: user.id }),
      appSupabase.from("liability_payments").select("liability_id, amount"),
      appSupabase
        .from("profiles")
        .select("tithe_target_percent")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (liabilitiesResult.error) {
    settingsAvailable = false;
  } else {
    const paidByLiability = new Map<string, number>();

    if (!paymentTotalsRpc.error && paymentTotalsRpc.data) {
      for (const row of paymentTotalsRpc.data) {
        paidByLiability.set(String(row.liability_id), Number(row.paid_total));
      }
    } else if (!paymentsResult.error) {
      for (const payment of paymentsResult.data ?? []) {
        paidByLiability.set(
          payment.liability_id,
          (paidByLiability.get(payment.liability_id) ?? 0) +
            Number(payment.amount)
        );
      }
    } else {
      settingsAvailable = false;
    }

    if (settingsAvailable) {
      liabilities = (liabilitiesResult.data ?? []).map((liability) => ({
        ...liability,
        original_balance: Number(liability.original_balance),
        paid_total: paidByLiability.get(liability.id) ?? 0,
      }));
    }
  }

  if (!profileResult.error && profileResult.data) {
    titheTargetPercent = Number(profileResult.data.tithe_target_percent ?? 10);
  }

  return NextResponse.json({
    startMonth: startDate.slice(0, 7),
    expenses: expenseAggregates,
    incomes: incomeAggregates,
    categories: categoryAggregates,
    liabilities,
    titheTargetPercent,
    settingsAvailable,
  });
}

async function fetchAggregatesFromRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ledger: any,
  ledgerUserId: string,
  startDate: string
) {
  const expenseAggregates = new Map<string, ExpenseAggregate>();
  const incomeAggregates = new Map<string, IncomeAggregate>();
  const categoryAggregates = new Map<string, CategoryAggregate>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await ledger
      .from("expenses")
      .select(
        "amount, currency, date, category_id, categories(name, classification)"
      )
      .eq("user_id", ledgerUserId)
      .gte("date", startDate)
      .order("date", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return {
        error: "Failed to fetch expenses",
        details: error.message,
      };
    }

    for (const row of data ?? []) {
      const month = String(row.date).slice(0, 7);
      const category = (row.categories ?? {}) as {
        name?: string;
        classification?: string;
      };
      const bucket = resolveBucket(category);
      const currency = String(row.currency);
      const key = `${month}|${bucket}|${currency}`;
      const existing = expenseAggregates.get(key);
      if (existing) {
        existing.total += Number(row.amount);
        existing.count += 1;
      } else {
        expenseAggregates.set(key, {
          month,
          bucket,
          currency,
          total: Number(row.amount),
          count: 1,
        });
      }

      const categoryKey = `${month}|${row.category_id}|${currency}`;
      const existingCategory = categoryAggregates.get(categoryKey);
      if (existingCategory) {
        existingCategory.total += Number(row.amount);
        existingCategory.count += 1;
      } else {
        categoryAggregates.set(categoryKey, {
          month,
          categoryId: String(row.category_id),
          categoryName: category.name ?? "—",
          currency,
          total: Number(row.amount),
          count: 1,
        });
      }
    }

    if (!data || data.length < pageSize) break;
  }

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await ledger
      .from("income_entries")
      .select("amount, currency, date")
      .eq("user_id", ledgerUserId)
      .gte("date", startDate)
      .order("date", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return {
        error: "Failed to fetch incomes",
        details: error.message,
      };
    }

    for (const row of data ?? []) {
      const month = String(row.date).slice(0, 7);
      const currency = String(row.currency);
      const key = `${month}|${currency}`;
      const existing = incomeAggregates.get(key);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        incomeAggregates.set(key, {
          month,
          currency,
          total: Number(row.amount),
        });
      }
    }

    if (!data || data.length < pageSize) break;
  }

  return {
    expenses: [...expenseAggregates.values()],
    incomes: [...incomeAggregates.values()],
    categories: [...categoryAggregates.values()],
  };
}
