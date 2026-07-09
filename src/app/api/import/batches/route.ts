import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { proposeImport } from "@/lib/import/propose";
import { resolveLedgerContext } from "@/lib/supabase/ledger";
import type { Database } from "@/types/database";

const createBatchSchema = z.object({
  format: z.enum(["santander_csv", "wise_csv"]),
  filename: z.string().trim().max(200).optional(),
  content: z.string().min(1).max(2_000_000),
});

export async function POST(request: NextRequest) {
  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createBatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
  }

  let proposal;
  try {
    proposal = await proposeImport({
      supabase: ledger.supabase,
      userId: ledger.userId,
      format: parsed.data.format,
      csvText: parsed.data.content,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not parse CSV",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 422 }
    );
  }

  const { data, error } = await ledger.supabase
    .from("import_batches")
    .insert({
      user_id: ledger.userId,
      source_format: parsed.data.format,
      filename: parsed.data.filename ?? null,
      status: "pending",
      rows: proposal.rows as unknown as Database["public"]["Tables"]["import_batches"]["Insert"]["rows"],
      ...proposal.counts,
    })
    .select("id, source_format, filename, status, new_count, duplicate_count, uncategorized_count, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save import batch", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    batch: data,
    skipped: proposal.skipped,
    titheCount: proposal.titheCount,
  });
}

export async function GET(request: NextRequest) {
  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await ledger.supabase
    .from("import_batches")
    .select(
      "id, source_format, filename, status, new_count, duplicate_count, uncategorized_count, created_at, committed_at"
    )
    .eq("user_id", ledger.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch import batches", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ batches: data ?? [] });
}
