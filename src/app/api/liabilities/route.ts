import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

const liabilitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["loan", "mortgage", "credit_card", "personal", "other"]),
  original_balance: z.number().nonnegative(),
  currency: z.string().trim().length(3),
  interest_rate_percent: z.number().min(0).max(100).nullable().optional(),
  opened_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

/** Liabilities live in the app project; standard user-client access via RLS. */
export async function GET(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [liabilitiesResult, paymentsResult] = await Promise.all([
    supabase
      .from("liabilities")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("liability_payments")
      .select("*")
      .order("payment_date", { ascending: false }),
  ]);

  if (liabilitiesResult.error || paymentsResult.error) {
    return NextResponse.json(
      {
        error: "Failed to fetch liabilities (are the 2026-07-03 migrations applied?)",
        details:
          liabilitiesResult.error?.message ?? paymentsResult.error?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    liabilities: liabilitiesResult.data ?? [],
    payments: paymentsResult.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = liabilitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid liability payload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("liabilities")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to create liability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ liability: data }, { status: 201 });
}
