import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { resolveUserDataClient } from "@/lib/supabase/user-data";
import { incomeSchema } from "@/lib/validations";

const incomeQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  search: z.string().trim().min(1).max(255).optional(),
});

function getMonthDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  return { startDate, endDate };
}

function normalizeDescription(description: string | null | undefined) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = incomeQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid income query" },
      { status: 400 }
    );
  }

  const { supabase, userId: effectiveUserId } = await resolveUserDataClient({
    supabase: appSupabase,
    user,
  });

  const { startDate, endDate } = getMonthDateRange(
    parsed.data.month,
    parsed.data.year
  );

  let query = supabase
    .from("income_entries")
    .select("*, categories(*)")
    .eq("user_id", effectiveUserId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });

  if (parsed.data.search) {
    query = query.or(
      `source.ilike.%${parsed.data.search}%,description.ilike.%${parsed.data.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch incomes", error);
    return NextResponse.json(
      { error: "Unable to fetch incomes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ incomes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = incomeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid income payload" },
      { status: 400 }
    );
  }

  const { supabase, userId: effectiveUserId } = await resolveUserDataClient({
    supabase: appSupabase,
    user,
  });

  const { loan_id: loanId, category_id, ...incomeFields } = parsed.data;

  if (loanId) {
    const { data: loan, error: loanError } = await appSupabase
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (loanError || !loan) {
      return NextResponse.json(
        { error: "Loan not found for repayment" },
        { status: loanError ? 500 : 404 }
      );
    }

    const { data: existingRepayments } = await appSupabase
      .from("loan_repayments")
      .select("amount")
      .eq("loan_id", loan.id);

    const repaidSoFar = (existingRepayments ?? []).reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    const outstanding = Math.max(Number(loan.principal) - repaidSoFar, 0);
    if (Number(incomeFields.amount) > outstanding + 0.001) {
      return NextResponse.json(
        {
          error: "Repayment exceeds outstanding balance",
          outstanding,
        },
        { status: 400 }
      );
    }
  }

  const { data: income, error } = await supabase
    .from("income_entries")
    .insert({
      ...incomeFields,
      category_id: category_id ?? null,
      source: incomeFields.source.trim(),
      description: normalizeDescription(incomeFields.description),
      user_id: effectiveUserId,
    })
    .select("id")
    .single();

  if (error || !income) {
    console.error("Failed to create income entry", error);
    return NextResponse.json(
      { error: "Unable to create income entry" },
      { status: 500 }
    );
  }

  if (loanId) {
    const { error: repaymentError } = await appSupabase
      .from("loan_repayments")
      .insert({
        loan_id: loanId,
        user_id: user.id,
        repayment_date: incomeFields.date,
        amount: incomeFields.amount,
        currency: incomeFields.currency,
        note: normalizeDescription(incomeFields.description),
        income_entry_id: income.id,
      });

    if (repaymentError) {
      await supabase.from("income_entries").delete().eq("id", income.id);
      return NextResponse.json(
        {
          error: "Unable to record loan repayment",
          details: repaymentError.message,
        },
        { status: 500 }
      );
    }

    const { data: allRepayments } = await appSupabase
      .from("loan_repayments")
      .select("amount")
      .eq("loan_id", loanId);
    const repaid = (allRepayments ?? []).reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    const { data: loan } = await appSupabase
      .from("loans")
      .select("principal, is_active")
      .eq("id", loanId)
      .maybeSingle();
    if (
      loan &&
      loan.is_active &&
      Math.max(Number(loan.principal) - repaid, 0) <= 0.001
    ) {
      await appSupabase
        .from("loans")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", loanId)
        .eq("user_id", user.id);
    }
  }

  return NextResponse.json({ ok: true, income_id: income.id }, { status: 201 });
}
