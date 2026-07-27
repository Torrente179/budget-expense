import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  kind: z
    .enum(["brokerage", "fund", "stocks", "crypto", "pension", "other"])
    .optional(),
  institution: z.string().trim().max(120).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  current_value: z.number().finite().nonnegative().optional(),
  contributed_cost: z.number().finite().nonnegative().optional(),
  reference: z.string().trim().max(64).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  valued_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Archiving keeps history intact — prefer it to DELETE. */
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

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid investment payload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("wealth_investments")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to update investment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ investment: data });
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

  const { error } = await supabase
    .from("wealth_investments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete investment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
