import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid batch id" }, { status: 400 });
  }

  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, userId } = ledger;
  const batchId = parsedParams.data.id;

  const { data: batch, error: fetchError } = await supabase
    .from("import_batches")
    .select("id, status")
    .eq("id", batchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch batch", details: fetchError.message },
      { status: 500 }
    );
  }
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (batch.status !== "committed") {
    return NextResponse.json(
      { error: `Only committed batches can be rolled back (batch is ${batch.status})` },
      { status: 409 }
    );
  }

  const [expensesResult, incomesResult] = await Promise.all([
    supabase
      .from("expenses")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("import_batch_id", batchId),
    supabase
      .from("income_entries")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("import_batch_id", batchId),
  ]);

  if (expensesResult.error || incomesResult.error) {
    return NextResponse.json(
      {
        error: "Partial rollback failure — retry to finish",
        details:
          expensesResult.error?.message ?? incomesResult.error?.message,
      },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("import_batches")
    .update({ status: "rolled_back" })
    .eq("id", batchId)
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json(
      { error: "Rows removed but status update failed", details: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    removedExpenses: expensesResult.count ?? 0,
    removedIncomes: incomesResult.count ?? 0,
  });
}
