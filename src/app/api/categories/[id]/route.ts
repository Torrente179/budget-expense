import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  classification: z
    .enum(["essential", "discretionary", "giving", "savings"])
    .optional(),
});

/**
 * Categories are MIRRORED across the app and ledger projects with identical
 * UUIDs (the ledger's expenses.category_id FK depends on it). Updating only
 * the app copy silently desyncs the pair, so this route dual-writes: the app
 * project through the user client (RLS) and the ledger through service-role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(await request.json());
  if (!parsedBody.success || Object.keys(parsedBody.data).length === 0) {
    return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
  }

  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryId = parsedParams.data.id;

  // App project first — RLS restricts updates to the user's own categories.
  // Default categories (user_id NULL) are updatable only via the ledger write
  // below, so classification changes on defaults still propagate.
  const appResult = await appSupabase
    .from("categories")
    .update(parsedBody.data)
    .eq("id", categoryId)
    .select("*")
    .maybeSingle();

  if (appResult.error) {
    return NextResponse.json(
      { error: "Unable to update category", details: appResult.error.message },
      { status: 500 }
    );
  }

  // Mirror to the ledger project (service-role bypasses RLS)
  let ledgerSynced = false;
  const ledgerSupabase = createServiceRoleClient();
  if (ledgerSupabase) {
    const ledgerResult = await ledgerSupabase
      .from("categories")
      .update(parsedBody.data)
      .eq("id", categoryId)
      .select("id")
      .maybeSingle();
    if (ledgerResult.error) {
      console.error(
        "Category dual-write failed on ledger project",
        ledgerResult.error
      );
    } else {
      ledgerSynced = Boolean(ledgerResult.data);
    }
  }

  const category =
    appResult.data ??
    (ledgerSupabase
      ? (
          await ledgerSupabase
            .from("categories")
            .select("*")
            .eq("id", categoryId)
            .maybeSingle()
        ).data
      : null);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category, ledgerSynced });
}
