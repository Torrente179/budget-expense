import { NextRequest, NextResponse } from "next/server";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

/**
 * Rows waiting for the weekly review: imported/uncertain movements flagged
 * needs_review. Thin and separately cacheable from the household insights.
 */
export async function GET(request: NextRequest) {
  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error, count } = await ledger.supabase
    .from("expenses")
    .select("*, categories(*)", { count: "exact" })
    .eq("user_id", ledger.userId)
    .eq("needs_review", true)
    .order("date", { ascending: false })
    .limit(100);

  // needs_review column missing → migrations pending; report empty
  if (error) {
    return NextResponse.json({ expenses: [], count: 0, available: false });
  }

  return NextResponse.json({
    expenses: data ?? [],
    count: count ?? 0,
    available: true,
  });
}
