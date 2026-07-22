import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveLedgerWriteClient, resolveLoanCategoryId } from "@/lib/loans/ledger";
import { createRequestClient } from "@/lib/supabase/request";

const paramsSchema = z.object({ id: z.string().uuid() });

const repaymentSchema = z.object({
  repayment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().trim().length(3),
  note: z.string().trim().max(300).nullable().optional(),
  /** Localized income source (e.g. "Cobro de préstamo — Ana"). */
  income_source: z.string().trim().min(1).max(100).optional(),
  /** When true (default), also create an income movement. */
  create_movement: z.boolean().optional().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  }

  const parsedBody = repaymentSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid repayment payload" },
      { status: 400 }
    );
  }

  const clients = await resolveLedgerWriteClient(request);
  if (!clients) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { app, ledger, ledgerUserId, user } = clients;

  const { data: loan, error: loanError } = await app.supabase
    .from("loans")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loanError) {
    return NextResponse.json(
      { error: "Unable to load loan", details: loanError.message },
      { status: 500 }
    );
  }
  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  const { data: existingRepayments, error: existingError } = await app.supabase
    .from("loan_repayments")
    .select("amount")
    .eq("loan_id", loan.id);

  if (existingError) {
    return NextResponse.json(
      { error: "Unable to load repayments", details: existingError.message },
      { status: 500 }
    );
  }

  const repaidSoFar = (existingRepayments ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );
  const outstanding = Math.max(Number(loan.principal) - repaidSoFar, 0);
  if (parsedBody.data.amount > outstanding + 0.001) {
    return NextResponse.json(
      {
        error: "Repayment exceeds outstanding balance",
        outstanding,
      },
      { status: 400 }
    );
  }

  let incomeEntryId: string | null = null;

  if (parsedBody.data.create_movement) {
    const categoryId = await resolveLoanCategoryId(app.supabase);
    const source = (
      parsedBody.data.income_source?.trim() ||
      `Loan repayment — ${loan.borrower_name}`
    ).slice(0, 100);
    const { data: income, error: incomeError } = await ledger
      .from("income_entries")
      .insert({
        user_id: ledgerUserId,
        amount: parsedBody.data.amount,
        currency: parsedBody.data.currency,
        source,
        description: parsedBody.data.note ?? null,
        date: parsedBody.data.repayment_date,
        source_kind: "manual",
        category_id: categoryId,
      })
      .select("id")
      .single();

    if (incomeError || !income) {
      return NextResponse.json(
        {
          error: "Unable to create income movement for repayment",
          details: incomeError?.message,
        },
        { status: 500 }
      );
    }
    incomeEntryId = income.id;
  }

  const { data, error } = await app.supabase
    .from("loan_repayments")
    .insert({
      loan_id: loan.id,
      user_id: user.id,
      repayment_date: parsedBody.data.repayment_date,
      amount: parsedBody.data.amount,
      currency: parsedBody.data.currency,
      note: parsedBody.data.note ?? null,
      income_entry_id: incomeEntryId,
    })
    .select("*")
    .single();

  if (error) {
    if (incomeEntryId) {
      await ledger.from("income_entries").delete().eq("id", incomeEntryId);
    }
    return NextResponse.json(
      { error: "Unable to record repayment", details: error.message },
      { status: 500 }
    );
  }

  const newOutstanding = Math.max(
    outstanding - parsedBody.data.amount,
    0
  );
  if (newOutstanding <= 0.001 && loan.is_active) {
    await app.supabase
      .from("loans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", loan.id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ repayment: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  }

  const repaymentId = request.nextUrl.searchParams.get("repaymentId");
  if (!repaymentId || !z.string().uuid().safeParse(repaymentId).success) {
    return NextResponse.json({ error: "Invalid repayment id" }, { status: 400 });
  }

  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("loan_repayments")
    .delete()
    .eq("id", repaymentId)
    .eq("loan_id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete repayment", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
