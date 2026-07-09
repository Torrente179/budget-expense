import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeForMatch } from "@/lib/ledger/normalize";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

const ruleSchema = z.object({
  /** Raw merchant text — normalized server-side before storing */
  pattern: z.string().trim().min(3).max(160),
  categoryId: z.string().uuid(),
});

/**
 * "Remember this" from the review ritual: persist a merchant → category rule.
 * User rules use priority 5 so they win over the seeded script rules.
 */
export async function POST(request: NextRequest) {
  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rule payload" }, { status: 400 });
  }

  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pattern = normalizeForMatch(parsed.data.pattern);
  if (!pattern) {
    return NextResponse.json({ error: "Empty pattern" }, { status: 400 });
  }

  const { error } = await ledger.supabase.from("categorization_rules").upsert(
    {
      user_id: ledger.userId,
      match_type: "merchant_keyword",
      pattern,
      category_id: parsed.data.categoryId,
      priority: 5,
      source: "user",
    },
    { onConflict: "user_id,match_type,pattern" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Unable to save rule", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
