import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isMissingTableError,
  logSuppressedSupabaseError,
} from "@/lib/supabase/postgrest-errors";

type RecurringExpense = Database["public"]["Tables"]["recurring_expenses"]["Row"];

interface SyncRecurringExpensesOptions {
  supabase: SupabaseClient<Database>;
  userId: string;
  month: number;
  year: number;
}

export function getMonthDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  return { startDate, endDate };
}

/**
 * First of the month when a recurring charge should begin.
 * If this month's charge day already passed, start next month so sync
 * does not materialize a backdated expense.
 */
export function resolveRecurringStartDate(
  chargeDay: number,
  today: Date = new Date()
): string {
  const day = Math.min(31, Math.max(1, Math.trunc(chargeDay) || 1));
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const todayDay = today.getDate();

  if (day >= todayDay) {
    return `${year}-${String(month).padStart(2, "0")}-01`;
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

// Deduplicate sync calls: once synced for a user+month, skip for SYNC_COOLDOWN
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const _syncCache = new Map<string, number>();

export async function syncRecurringExpensesForMonth({
  supabase,
  userId,
  month,
  year,
}: SyncRecurringExpensesOptions) {
  const cacheKey = `${userId}:${year}-${month}`;
  const lastSync = _syncCache.get(cacheKey);
  if (lastSync && Date.now() - lastSync < SYNC_COOLDOWN) {
    return;
  }
  const { startDate, endDate } = getMonthDateRange(month, year);
  const { data: recurringExpenses, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lt("start_date", endDate);

  if (error) {
    if (isMissingTableError(error, "recurring_expenses")) {
      logSuppressedSupabaseError(
        "Recurring expenses table is unavailable during monthly sync",
        error
      );
      return;
    }

    throw error;
  }

  if (!recurringExpenses || recurringExpenses.length === 0) {
    _syncCache.set(cacheKey, Date.now());
    return;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const recurringInsertRows: Database["public"]["Tables"]["expenses"]["Insert"][] = [];

  for (const recurringExpense of recurringExpenses as RecurringExpense[]) {
    const debitDay = Math.min(recurringExpense.charge_day, daysInMonth);
    const debitDate = `${year}-${String(month).padStart(2, "0")}-${String(debitDay).padStart(2, "0")}`;

    if (debitDate < recurringExpense.start_date) {
      continue;
    }

    recurringInsertRows.push({
      user_id: userId,
      category_id: recurringExpense.category_id,
      recurring_expense_id: recurringExpense.id,
      recurring_month: startDate,
      amount: recurringExpense.amount,
      currency: recurringExpense.currency,
      description: recurringExpense.description,
      date: debitDate,
    });
  }

  if (recurringInsertRows.length === 0) {
    _syncCache.set(cacheKey, Date.now());
    return;
  }

  const { error: upsertError } = await supabase.from("expenses").upsert(
    recurringInsertRows,
    {
    onConflict: "user_id,recurring_expense_id,recurring_month",
    ignoreDuplicates: true,
    }
  );

  if (upsertError) {
    throw upsertError;
  }

  _syncCache.set(cacheKey, Date.now());
}
