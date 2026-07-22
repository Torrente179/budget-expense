import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncRecurringExpensesForMonth } from "@/lib/recurring-expenses";
import { createRequestClient } from "@/lib/supabase/request";
import { resolveUserDataClient } from "@/lib/supabase/user-data";

const syncBodySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

/**
 * Materialize recurring expenses for a month. Called on month change and
 * after recurring-rule writes — not on every ledger GET.
 */
export async function POST(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = syncBodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  const { supabase, userId: effectiveUserId } = await resolveUserDataClient({
    supabase: appSupabase,
    user,
  });

  try {
    await syncRecurringExpensesForMonth({
      supabase,
      userId: effectiveUserId,
      month: parsed.data.month,
      year: parsed.data.year,
    });
  } catch (error) {
    console.error("Failed to sync recurring expenses", error);
    return NextResponse.json(
      { error: "Unable to sync recurring expenses" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
