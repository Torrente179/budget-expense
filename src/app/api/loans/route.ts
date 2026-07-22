import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveLedgerWriteClient,
  resolveLoanCategoryId,
} from "@/lib/loans/ledger";
import { upsertLoanPerson } from "@/lib/loans/people";
import { createRequestClient } from "@/lib/supabase/request";

const loanSchema = z.object({
  borrower_name: z.string().trim().min(1).max(120),
  principal: z.number().nonnegative(),
  currency: z.string().trim().length(3),
  lent_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  /** Localized expense description (e.g. "Préstamo a Ana"). */
  movement_description: z.string().trim().min(1).max(255).optional(),
  /** When true (default), also create a Loan-category expense movement. */
  create_movement: z.boolean().optional().default(true),
  /** Link an existing expense instead of creating one (create_movement ignored). */
  expense_id: z.string().uuid().optional(),
});

/** Receivables: money you lent. Outstanding = principal − Σ repayments. */
export async function GET(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [loansResult, repaymentsResult, peopleResult] = await Promise.all([
    supabase.from("loans").select("*").order("lent_date", { ascending: false }),
    supabase
      .from("loan_repayments")
      .select("*")
      .order("repayment_date", { ascending: false }),
    supabase.from("loan_people").select("*").order("name", { ascending: true }),
  ]);

  if (loansResult.error || repaymentsResult.error) {
    return NextResponse.json(
      {
        error:
          "Failed to fetch loans (is the 2026-07-22-loans-receivables migration applied?)",
        details: loansResult.error?.message ?? repaymentsResult.error?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    loans: loansResult.data ?? [],
    repayments: repaymentsResult.data ?? [],
    people: peopleResult.error ? [] : (peopleResult.data ?? []),
  });
}

export async function POST(request: NextRequest) {
  const clients = await resolveLedgerWriteClient(request);
  if (!clients) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = loanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid loan payload" }, { status: 400 });
  }

  const { app, ledger, ledgerUserId, user } = clients;
  const {
    borrower_name,
    principal,
    currency,
    lent_date,
    notes,
    movement_description,
    create_movement,
    expense_id: existingExpenseId,
  } = parsed.data;
  const date = lent_date ?? new Date().toISOString().slice(0, 10);

  await upsertLoanPerson(app.supabase, user.id, borrower_name);

  let expenseId: string | null = existingExpenseId ?? null;

  if (existingExpenseId) {
    const { data: existingLoan } = await app.supabase
      .from("loans")
      .select("id")
      .eq("expense_id", existingExpenseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingLoan) {
      return NextResponse.json(
        { error: "A loan is already linked to this expense", loan_id: existingLoan.id },
        { status: 409 }
      );
    }
  } else if (create_movement && principal > 0) {
    const categoryId = await resolveLoanCategoryId(app.supabase);
    if (!categoryId) {
      return NextResponse.json(
        {
          error:
            "Loan category is missing. Apply the 2026-07-22-loan-category migration.",
        },
        { status: 500 }
      );
    }

    const expenseDescription =
      movement_description?.trim() ||
      (typeof notes === "string" && notes.trim()) ||
      `Loan to ${borrower_name}`;

    const { data: expense, error: expenseError } = await ledger
      .from("expenses")
      .insert({
        user_id: ledgerUserId,
        amount: principal,
        currency,
        category_id: categoryId,
        description: expenseDescription,
        date,
        source_kind: "manual",
      })
      .select("id")
      .single();

    if (expenseError || !expense) {
      return NextResponse.json(
        {
          error: "Unable to create expense movement for loan",
          details: expenseError?.message,
        },
        { status: 500 }
      );
    }
    expenseId = expense.id;
  }

  const { data, error } = await app.supabase
    .from("loans")
    .insert({
      user_id: user.id,
      borrower_name,
      principal,
      currency,
      lent_date: date,
      notes: notes ?? null,
      expense_id: expenseId,
    })
    .select("*")
    .single();

  if (error) {
    if (expenseId) {
      await ledger.from("expenses").delete().eq("id", expenseId);
    }
    return NextResponse.json(
      { error: "Unable to create loan", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ loan: data }, { status: 201 });
}
