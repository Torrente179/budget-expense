import { NextRequest, NextResponse } from "next/server";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

/**
 * Count-only review badge endpoint — avoids loading the full review queue
 * for sidebar / attention-feed badges.
 */
export async function GET(request: NextRequest) {
  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count, error } = await ledger.supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ledger.userId)
    .eq("needs_review", true);

  if (error) {
    return NextResponse.json({ count: 0, available: false });
  }

  return NextResponse.json({
    count: count ?? 0,
    available: true,
  });
}
