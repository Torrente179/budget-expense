import { NextRequest, NextResponse } from "next/server";
import { addDays, format, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { isMissingTableError } from "@/lib/supabase/postgrest-errors";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = parseISO(value);
    return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
  }, "Invalid date");

const checkpointSchema = z
  .object({
    balance: z.number().finite().min(-999_999_999_999).max(999_999_999_999),
    expectedCurrency: z.string().regex(/^[A-Z]{3}$/),
    asOfDate: isoDateSchema,
    calculatedBalanceBefore: z.number().finite().nullable(),
    calculationStartDate: isoDateSchema.nullable(),
    calculationBasis: z
      .enum(["monthly_net", "tracked_balance"])
      .nullable(),
  })
  .superRefine((value, context) => {
    const comparisonValues = [
      value.calculatedBalanceBefore,
      value.calculationStartDate,
      value.calculationBasis,
    ];
    const hasComparison = comparisonValues.every((item) => item !== null);
    const hasNoComparison = comparisonValues.every((item) => item === null);
    if (!hasComparison && !hasNoComparison) {
      context.addIssue({
        code: "custom",
        message: "Reconciliation comparison fields must be complete",
      });
    }
  });

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkpointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid balance checkpoint", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Permit the client's local calendar date across UTC boundaries, but never
  // accept dates farther than tomorrow in server time.
  const latestAllowedDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  if (parsed.data.asOfDate > latestAllowedDate) {
    return NextResponse.json(
      { error: "Balance checkpoint cannot be future-dated" },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .maybeSingle();
  const profileCurrency = profile?.base_currency?.toUpperCase();

  if (profileError || !profileCurrency?.match(/^[A-Z]{3}$/)) {
    console.error("Failed to resolve checkpoint currency", profileError);
    return NextResponse.json(
      { error: "Unable to resolve profile currency" },
      { status: 500 }
    );
  }

  // The server remains authoritative for stored currency. This client value
  // is only a compare-and-reject guard against concurrent profile changes.
  if (parsed.data.expectedCurrency !== profileCurrency) {
    return NextResponse.json(
      { error: "Profile currency changed; review the balance and try again" },
      { status: 409 }
    );
  }

  const balance = roundToCents(parsed.data.balance);
  const calculatedBalanceBefore =
    parsed.data.calculatedBalanceBefore === null
      ? null
      : roundToCents(parsed.data.calculatedBalanceBefore);
  const reconciliationDelta =
    calculatedBalanceBefore === null
      ? null
      : roundToCents(balance - calculatedBalanceBefore);

  const { data, error } = await supabase
    .from("balance_checkpoints")
    .insert({
      user_id: user.id,
      balance,
      currency: profileCurrency,
      as_of_date: parsed.data.asOfDate,
      calculated_balance_before: calculatedBalanceBefore,
      reconciliation_delta: reconciliationDelta,
      calculation_start_date: parsed.data.calculationStartDate,
      calculation_basis: parsed.data.calculationBasis,
    })
    .select(
      "id, balance, currency, as_of_date, calculated_balance_before, reconciliation_delta, calculation_start_date, calculation_basis, created_at"
    )
    .single();

  if (error) {
    if (isMissingTableError(error, "balance_checkpoints")) {
      return NextResponse.json(
        { error: "Balance tracking is not available yet" },
        { status: 503 }
      );
    }
    console.error("Failed to create balance checkpoint", error);
    return NextResponse.json(
      { error: "Unable to save balance checkpoint" },
      { status: 500 }
    );
  }

  return NextResponse.json({ checkpoint: data }, { status: 201 });
}
