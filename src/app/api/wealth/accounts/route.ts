import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { isMissingTableError } from "@/lib/supabase/postgrest-errors";

const ACCOUNT_KINDS = [
  "checking",
  "savings",
  "cash",
  "digital_wallet",
  "other",
] as const;

const accountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(ACCOUNT_KINDS),
  institution: z.string().trim().max(120).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase(),
  opening_balance: z.number().finite(),
  opening_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  include_in_available: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  icon: z.string().trim().max(48).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

/**
 * Cuentas y efectivo. Balance is derived — opening_balance plus the signed
 * movements — so this returns both tables and lets the client sum them once.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [accountsResult, movementsResult] = await Promise.all([
    supabase
      .from("wealth_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("wealth_account_movements")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false }),
  ]);

  const error = accountsResult.error ?? movementsResult.error;

  if (error) {
    // A deploy that lands before the migration should degrade, not 500.
    if (
      isMissingTableError(error, "wealth_accounts") ||
      isMissingTableError(error, "wealth_account_movements")
    ) {
      return NextResponse.json(
        { error: "Wealth accounts are not available yet" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to fetch wealth accounts (is the 20260726000000_wealth_accounts migration applied?)",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accounts: accountsResult.data ?? [],
    movements: movementsResult.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = accountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid account payload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("wealth_accounts")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    // Partial unique index on (user_id) WHERE is_primary.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another account is already the primary one" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create account", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ account: data }, { status: 201 });
}
