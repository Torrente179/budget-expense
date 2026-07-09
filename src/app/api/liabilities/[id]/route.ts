import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  kind: z.enum(["loan", "mortgage", "credit_card", "personal", "other"]).optional(),
  original_balance: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  interest_rate_percent: z.number().min(0).max(100).nullable().optional(),
  opened_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid liability id" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid liability payload" }, { status: 400 });
  }

  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("liabilities")
    .update({ ...parsedBody.data, updated_at: new Date().toISOString() })
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to update liability", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Liability not found" }, { status: 404 });
  }

  return NextResponse.json({ liability: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid liability id" }, { status: 400 });
  }

  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("liabilities")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete liability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
