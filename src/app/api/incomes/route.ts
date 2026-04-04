import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
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

  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { startDate, endDate } = getMonthDateRange(
    parsed.data.month,
    parsed.data.year
  );

  let query = supabase
    .from("income_entries")
    .select("*")
    .eq("user_id", user.id)
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
  const parsed = incomeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid income payload" },
      { status: 400 }
    );
  }

  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("income_entries").insert({
    ...parsed.data,
    source: parsed.data.source.trim(),
    description: normalizeDescription(parsed.data.description),
    user_id: user.id,
  });

  if (error) {
    console.error("Failed to create income entry", error);
    return NextResponse.json(
      { error: "Unable to create income entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
