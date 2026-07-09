import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ProposedRow } from "@/lib/import/types";
import { resolveLedgerContext } from "@/lib/supabase/ledger";
import type { Database } from "@/types/database";

const paramsSchema = z.object({ id: z.string().uuid() });

const patchSchema = z.object({
  rows: z
    .array(
      z.object({
        index: z.number().int().min(0),
        categoryId: z.string().uuid().nullable().optional(),
        categoryName: z.string().max(120).nullable().optional(),
        include: z.boolean().optional(),
        rememberRule: z.boolean().optional(),
      })
    )
    .min(1)
    .max(5000),
});

function recount(rows: ProposedRow[]) {
  return {
    new_count: rows.filter((row) => row.status === "new").length,
    duplicate_count: rows.filter((row) => row.status === "duplicate").length,
    uncategorized_count: rows.filter((row) => row.status === "uncategorized")
      .length,
  };
}

export async function GET(
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

  const { data, error } = await ledger.supabase
    .from("import_batches")
    .select("*")
    .eq("id", parsedParams.data.id)
    .eq("user_id", ledger.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch batch", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ batch: data });
}

export async function PATCH(
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

  const parsedBody = patchSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid overrides" }, { status: 400 });
  }

  const { data: batch, error: fetchError } = await ledger.supabase
    .from("import_batches")
    .select("id, status, rows")
    .eq("id", parsedParams.data.id)
    .eq("user_id", ledger.userId)
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
  if (batch.status !== "pending") {
    return NextResponse.json(
      { error: `Batch is ${batch.status}; only pending batches can be edited` },
      { status: 409 }
    );
  }

  const rows = batch.rows as unknown as ProposedRow[];
  const rowByIndex = new Map(rows.map((row) => [row.index, row]));

  for (const override of parsedBody.data.rows) {
    const row = rowByIndex.get(override.index);
    if (!row) continue;

    if (override.categoryId !== undefined && row.rowType === "expense") {
      row.categoryId = override.categoryId;
      row.categoryName = override.categoryName ?? null;
      row.categorySource = override.categoryId ? "user" : "none";
      row.needsReview = !override.categoryId;
      // A manually categorized row is importable again
      if (row.status === "uncategorized" && override.categoryId) {
        row.status = "new";
        row.include = true;
      }
      if (!override.categoryId) {
        row.status = "uncategorized";
      }
    }
    if (override.include !== undefined) {
      row.include = override.include;
    }
    if (override.rememberRule !== undefined) {
      row.rememberRule = override.rememberRule;
    }
  }

  const counts = recount(rows);
  const { data: updated, error: updateError } = await ledger.supabase
    .from("import_batches")
    .update({
      rows: rows as unknown as Database["public"]["Tables"]["import_batches"]["Update"]["rows"],
      ...counts,
    })
    .eq("id", batch.id)
    .eq("user_id", ledger.userId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update batch", details: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ batch: updated });
}

export async function DELETE(
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

  const { data, error } = await ledger.supabase
    .from("import_batches")
    .update({ status: "discarded" })
    .eq("id", parsedParams.data.id)
    .eq("user_id", ledger.userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to discard batch", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Batch not found or not pending" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
