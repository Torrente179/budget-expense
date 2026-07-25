import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

/**
 * Amount is signed: a withdrawal is negative. The DB trigger inherits the
 * currency from the parent account, so a movement never introduces an FX
 * event of its own.
 */
const movementSchema = z.object({
  movement_type: z.enum([
    "opening_balance",
    "transfer_in",
    "transfer_out",
    "adjustment",
  ]),
  amount: z.number().finite().refine((value) => value !== 0, {
    message: "Amount must not be zero",
  }),
  occurred_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().trim().max(500).nullable().optional(),
  linked_account_id: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = movementSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid movement payload" },
      { status: 400 }
    );
  }

  // Confirm ownership up front so a bad account id is a 404, not the
  // trigger's raw 42501.
  const { data: account } = await supabase
    .from("wealth_accounts")
    .select("id, currency")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("wealth_account_movements")
    .insert({
      ...parsed.data,
      account_id: id,
      user_id: user.id,
      currency: account.currency,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to record movement", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ movement: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const movementId = new URL(request.url).searchParams.get("movement_id");
  if (!movementId) {
    return NextResponse.json(
      { error: "movement_id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("wealth_account_movements")
    .delete()
    .eq("id", movementId)
    .eq("account_id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete movement", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
