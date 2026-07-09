import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMonthDateRange,
  syncRecurringExpensesForMonth,
} from "@/lib/recurring-expenses";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import { expenseSchema } from "@/lib/validations";

const expenseQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(255).optional(),
});

function normalizeDescription(description: string | null | undefined) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const parsed = expenseQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
    categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid expense query" },
      { status: 400 }
    );
  }

  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;
  const supabase = ledgerSupabase ?? appSupabase;
  const effectiveUserId = ledgerUser?.id ?? user.id;

  try {
    await syncRecurringExpensesForMonth({
      supabase,
      userId: effectiveUserId,
      month: parsed.data.month,
      year: parsed.data.year,
    });
  } catch (error) {
    console.error("Failed to sync recurring expenses before expense fetch", error);
  }

  const { startDate, endDate } = getMonthDateRange(
    parsed.data.month,
    parsed.data.year
  );

  let query = supabase
    .from("expenses")
    .select("*, categories(*)")
    .eq("user_id", effectiveUserId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });

  if (parsed.data.categoryId) {
    query = query.eq("category_id", parsed.data.categoryId);
  }

  if (parsed.data.search) {
    query = query.ilike("description", `%${parsed.data.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch expenses", error);
    return NextResponse.json(
      { error: "Unable to fetch expenses" },
      { status: 500 }
    );
  }

  // No HTTP cache: the client-side react-query cache owns freshness, and a
  // browser-cached response here would defeat invalidation after mutations.
  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const parsed = expenseSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid expense payload" },
      { status: 400 }
    );
  }

  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;
  const supabase = ledgerSupabase ?? appSupabase;
  const effectiveUserId = ledgerUser?.id ?? user.id;

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      ...parsed.data,
      description: normalizeDescription(parsed.data.description),
      user_id: effectiveUserId,
    })
    .select("*, categories(*)")
    .single();

  if (error) {
    console.error("Failed to create expense", error);
    return NextResponse.json(
      { error: "Unable to create expense" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, expense: data }, { status: 201 });
}
