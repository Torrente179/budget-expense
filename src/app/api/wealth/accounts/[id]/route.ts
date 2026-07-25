import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

const accountPatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  kind: z
    .enum(["checking", "savings", "cash", "digital_wallet", "other"])
    .optional(),
  institution: z.string().trim().max(120).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  opening_balance: z.number().finite().optional(),
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
  /** Archiving is the safe retirement path — see DELETE below. */
  status: z.enum(["active", "closed", "archived"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = accountPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid account payload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("wealth_accounts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another account is already the primary one" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Unable to update account", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ account: data });
}

/**
 * Hard delete. Movements cascade, so an account with history silently rewrites
 * past net worth — the UI should offer `status: "archived"` via PATCH instead
 * and reserve this for accounts created by mistake.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("wealth_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete account", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
