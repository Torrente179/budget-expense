import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";

const paramsSchema = z.object({ id: z.string().uuid() });

const paymentSchema = z.object({
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Negative amounts are manual upward balance adjustments
  amount: z.number().refine((value) => value !== 0, "Amount cannot be zero"),
  currency: z.string().trim().length(3),
  note: z.string().trim().max(300).nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid liability id" }, { status: 400 });
  }

  const parsedBody = paymentSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("liability_payments")
    .insert({
      ...parsedBody.data,
      liability_id: parsedParams.data.id,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to record payment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ payment: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid liability id" }, { status: 400 });
  }

  const paymentId = request.nextUrl.searchParams.get("paymentId");
  if (!paymentId || !z.string().uuid().safeParse(paymentId).success) {
    return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("liability_payments")
    .delete()
    .eq("id", paymentId)
    .eq("liability_id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete payment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
