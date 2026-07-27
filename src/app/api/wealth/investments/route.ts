import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { isMissingTableError } from "@/lib/supabase/postgrest-errors";

const KINDS = [
  "brokerage",
  "fund",
  "stocks",
  "crypto",
  "pension",
  "other",
] as const;

const investmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(KINDS),
  institution: z.string().trim().max(120).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase(),
  current_value: z.number().finite().nonnegative(),
  contributed_cost: z.number().finite().nonnegative(),
  reference: z.string().trim().max(64).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  valued_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * Manually valued holdings — pensions, funds, crypto the user prices by hand.
 * Trade-tracked positions live under /api/investments and are never
 * duplicated here.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("wealth_investments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "wealth_investments")) {
      return NextResponse.json({ investments: [] });
    }
    return NextResponse.json(
      {
        error:
          "Failed to fetch investments (is the 20260726000004_wealth_investments migration applied?)",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ investments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = investmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid investment payload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("wealth_investments")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error, "wealth_investments")) {
      return NextResponse.json(
        { error: "Investments are not available yet" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to create investment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ investment: data }, { status: 201 });
}
