import { createClient } from "@/lib/supabase/server";
import { getMonthDateRange } from "@/lib/recurring-expenses";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";
import { ExpensesLedgerPage } from "@/components/expenses/expenses-ledger-page";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Category | null;
};

interface ExpensesPageProps {
  searchParams: Promise<{
    month?: string | string[];
    year?: string | string[];
    category?: string | string[];
    search?: string | string[];
  }>;
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  range: { min: number; max: number }
) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(range.max, Math.max(range.min, parsed));
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const appSupabase = await createClient();
  const {
    data: { user },
  } = await appSupabase.auth.getUser();

  if (!user) {
    return (
      <ExpensesLedgerPage
        initialMonth={getCurrentMonth()}
        initialYear={getCurrentYear()}
        initialCategoryId="all"
        initialSearch=""
        categories={[]}
        expenses={[]}
      />
    );
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;
  const supabase = ledgerSupabase ?? appSupabase;
  const effectiveUserId = ledgerUser?.id ?? user.id;

  const { data: latestExpense } = await supabase
    .from("expenses")
    .select("date")
    .eq("user_id", effectiveUserId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fallbackDate = latestExpense?.date
    ? new Date(`${latestExpense.date}T00:00:00`)
    : new Date();

  const month = parseInteger(getSingleValue(params.month), fallbackDate.getMonth() + 1, {
    min: 1,
    max: 12,
  });
  const year = parseInteger(getSingleValue(params.year), fallbackDate.getFullYear(), {
    min: 2020,
    max: 2100,
  });
  const categoryId = getSingleValue(params.category) ?? "all";
  const search = (getSingleValue(params.search) ?? "").trim();

  const { startDate, endDate } = getMonthDateRange(month, year);

  const categoriesPromise = supabase
    .from("categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${effectiveUserId}`)
    .order("name");

  let expensesQuery = supabase
    .from("expenses")
    .select("*, categories(*)")
    .eq("user_id", effectiveUserId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });

  if (categoryId !== "all") {
    expensesQuery = expensesQuery.eq("category_id", categoryId);
  }

  if (search) {
    expensesQuery = expensesQuery.ilike("description", `%${search}%`);
  }

  const [{ data: categories }, { data: expenses }] = await Promise.all([
    categoriesPromise,
    expensesQuery,
  ]);

  return (
    <ExpensesLedgerPage
      initialMonth={month}
      initialYear={year}
      initialCategoryId={categoryId}
      initialSearch={search}
      categories={(categories ?? []) as Category[]}
      expenses={(expenses ?? []) as Expense[]}
    />
  );
}
