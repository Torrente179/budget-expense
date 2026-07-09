import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";

/**
 * Trailing-12-month household aggregates for the stewardship metrics.
 *
 * Ledger project: expenses (grouped month × bucket × currency) and incomes
 * (month × currency). App project: liabilities (+paid totals) and the tithe
 * target. Amounts stay in their original currencies — the client converts,
 * matching the /api/dashboard/summary pattern.
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
  month: string; // YYYY-MM
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
  // Keyword fallback for giving categories that predate classification
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

  const startDate = monthsAgoIso(11); // current month + 11 previous

  // --- Ledger: expenses + incomes, paginated ------------------------------
  const expenseAggregates = new Map<string, ExpenseAggregate>();
  const incomeAggregates = new Map<string, IncomeAggregate>();
  // month × category × currency — anomaly detection needs category grain
  const categoryAggregates = new Map<
    string,
    {
      month: string;
      categoryId: string;
      categoryName: string;
      currency: string;
      total: number;
      count: number;
    }
  >();

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
      return NextResponse.json(
        { error: "Failed to fetch expenses", details: error.message },
        { status: 500 }
      );
    }

    for (const row of data ?? []) {
      const month = row.date.slice(0, 7);
      const category = (row.categories ?? {}) as {
        name?: string;
        classification?: string;
      };
      const bucket = resolveBucket(category);
      const key = `${month}|${bucket}|${row.currency}`;
      const existing = expenseAggregates.get(key);
      if (existing) {
        existing.total += Number(row.amount);
        existing.count += 1;
      } else {
        expenseAggregates.set(key, {
          month,
          bucket,
          currency: row.currency,
          total: Number(row.amount),
          count: 1,
        });
      }

      const categoryKey = `${month}|${row.category_id}|${row.currency}`;
      const existingCategory = categoryAggregates.get(categoryKey);
      if (existingCategory) {
        existingCategory.total += Number(row.amount);
        existingCategory.count += 1;
      } else {
        categoryAggregates.set(categoryKey, {
          month,
          categoryId: row.category_id,
          categoryName: category.name ?? "—",
          currency: row.currency,
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
      return NextResponse.json(
        { error: "Failed to fetch incomes", details: error.message },
        { status: 500 }
      );
    }

    for (const row of data ?? []) {
      const month = row.date.slice(0, 7);
      const key = `${month}|${row.currency}`;
      const existing = incomeAggregates.get(key);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        incomeAggregates.set(key, {
          month,
          currency: row.currency,
          total: Number(row.amount),
        });
      }
    }

    if (!data || data.length < pageSize) break;
  }

  // --- App project: liabilities + tithe target (tolerate pending migration)
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

  const [liabilitiesResult, paymentsResult, profileResult] = await Promise.all([
    appSupabase
      .from("liabilities")
      .select("id, name, kind, currency, original_balance, interest_rate_percent, is_active"),
    appSupabase.from("liability_payments").select("liability_id, amount"),
    appSupabase
      .from("profiles")
      .select("tithe_target_percent")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (liabilitiesResult.error || paymentsResult.error) {
    settingsAvailable = false; // tables missing until migrations run
  } else {
    const paidByLiability = new Map<string, number>();
    for (const payment of paymentsResult.data ?? []) {
      paidByLiability.set(
        payment.liability_id,
        (paidByLiability.get(payment.liability_id) ?? 0) +
          Number(payment.amount)
      );
    }
    liabilities = (liabilitiesResult.data ?? []).map((liability) => ({
      ...liability,
      original_balance: Number(liability.original_balance),
      paid_total: paidByLiability.get(liability.id) ?? 0,
    }));
  }

  if (!profileResult.error && profileResult.data) {
    titheTargetPercent = Number(profileResult.data.tithe_target_percent ?? 10);
  }

  return NextResponse.json({
    startMonth: startDate.slice(0, 7),
    expenses: [...expenseAggregates.values()],
    incomes: [...incomeAggregates.values()],
    categories: [...categoryAggregates.values()],
    liabilities,
    titheTargetPercent,
    settingsAvailable,
  });
}
