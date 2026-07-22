import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveLedgerWriteClient } from "@/lib/loans/ledger";
import { createRequestClient } from "@/lib/supabase/request";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  borrower_name: z.string().trim().min(1).max(120).optional(),
  principal: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  lent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid loan payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("loans")
    .update({ ...parsedBody.data, updated_at: new Date().toISOString() })
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to update loan", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  return NextResponse.json({ loan: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const app = await createRequestClient(request);
  if (!app.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { supabase, user } = app;

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  }

  const deleteExpense =
    request.nextUrl.searchParams.get("delete_expense") === "1" ||
    request.nextUrl.searchParams.get("delete_expense") === "true";

  const { data: loan, error: loadError } = await supabase
    .from("loans")
    .select("id, expense_id")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json(
      { error: "Unable to load loan", details: loadError.message },
      { status: 500 }
    );
  }
  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  const expenseId = loan.expense_id;

  const { error } = await supabase
    .from("loans")
    .delete()
    .eq("id", loan.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete loan", details: error.message },
      { status: 500 }
    );
  }

  if (deleteExpense && expenseId) {
    const clients = await resolveLedgerWriteClient(request, app);
    if (clients) {
      await clients.ledger.from("expenses").delete().eq("id", expenseId);
    }
  }

  return NextResponse.json({ ok: true });
}
