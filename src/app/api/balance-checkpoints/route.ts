import { NextRequest, NextResponse } from "next/server";
import { addDays, format, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { getBalanceAdjustmentLabel } from "@/lib/balance-checkpoint";
import { createRequestClient } from "@/lib/supabase/request";
import { isMissingTableError } from "@/lib/supabase/postgrest-errors";
import { resolveUserDataClient } from "@/lib/supabase/user-data";

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

async function resolveDefaultCategoryId(
  supabase: Awaited<ReturnType<typeof createRequestClient>>["supabase"],
  name: string
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, user_id")
    .ilike("name", name);

  if (error || !data?.length) return null;

  const normalized = data.filter(
    (row) => row.name.trim().toLowerCase() === name.toLowerCase()
  );
  const global = normalized.find((row) => row.user_id === null);
  return (global ?? normalized[0])?.id ?? null;
}

export async function POST(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);

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

  const { data: profile, error: profileError } = await appSupabase
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

  const { supabase, userId: effectiveUserId } = await resolveUserDataClient({
    supabase: appSupabase,
    user,
  });

  const balance = roundToCents(parsed.data.balance);
  const calculatedBalanceBefore =
    parsed.data.calculatedBalanceBefore === null
      ? null
      : roundToCents(parsed.data.calculatedBalanceBefore);
  const reconciliationDelta =
    calculatedBalanceBefore === null
      ? null
      : roundToCents(balance - calculatedBalanceBefore);

  // Book the delta as a ledger movement before the checkpoint so same-day
  // ordering keeps it inside the checkpoint baseline (not double-counted).
  // Canonical English labels are stored; the UI translates to Spanish.
  let adjustmentMovement:
    | { kind: "income" | "expense"; id: string }
    | null = null;

  const adjustmentLabel =
    reconciliationDelta === null
      ? null
      : getBalanceAdjustmentLabel({
          delta: reconciliationDelta,
          calculationBasis: parsed.data.calculationBasis,
        });

  if (adjustmentLabel && reconciliationDelta !== null) {
    const amount = Math.abs(reconciliationDelta);

    if (reconciliationDelta > 0) {
      const categoryId = await resolveDefaultCategoryId(
        supabase,
        "Other Income"
      );
      const { data: income, error: incomeError } = await supabase
        .from("income_entries")
        .insert({
          user_id: effectiveUserId,
          amount,
          currency: profileCurrency,
          date: parsed.data.asOfDate,
          source: adjustmentLabel.en,
          description: adjustmentLabel.es,
          category_id: categoryId,
          source_kind: "manual",
          needs_review: false,
        })
        .select("id")
        .single();

      if (incomeError || !income) {
        console.error("Failed to book reconciliation surplus", incomeError);
        return NextResponse.json(
          { error: "Unable to record reconciliation surplus" },
          { status: 500 }
        );
      }
      adjustmentMovement = { kind: "income", id: income.id };
    } else {
      const categoryId = await resolveDefaultCategoryId(supabase, "Other");
      if (!categoryId) {
        return NextResponse.json(
          { error: "Unable to resolve expense category for deficit" },
          { status: 500 }
        );
      }

      // Expenses have a single description field: store "EN / ES" so both
      // languages are present in the ledger row and either side can translate.
      const description = `${adjustmentLabel.en} / ${adjustmentLabel.es}`;
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: effectiveUserId,
          amount,
          currency: profileCurrency,
          date: parsed.data.asOfDate,
          description,
          category_id: categoryId,
          source_kind: "manual",
          needs_review: false,
        })
        .select("id")
        .single();

      if (expenseError || !expense) {
        console.error("Failed to book reconciliation deficit", expenseError);
        return NextResponse.json(
          { error: "Unable to record reconciliation deficit" },
          { status: 500 }
        );
      }
      adjustmentMovement = { kind: "expense", id: expense.id };
    }
  }

  const { data, error } = await supabase
    .from("balance_checkpoints")
    .insert({
      user_id: effectiveUserId,
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
    if (adjustmentMovement) {
      if (adjustmentMovement.kind === "income") {
        await supabase
          .from("income_entries")
          .delete()
          .eq("id", adjustmentMovement.id)
          .eq("user_id", effectiveUserId);
      } else {
        await supabase
          .from("expenses")
          .delete()
          .eq("id", adjustmentMovement.id)
          .eq("user_id", effectiveUserId);
      }
    }

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

  return NextResponse.json(
    {
      checkpoint: data,
      adjustmentMovement,
    },
    { status: 201 }
  );
}
