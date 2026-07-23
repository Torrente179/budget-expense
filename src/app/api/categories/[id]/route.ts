import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BUDGET_ROLES } from "@/lib/budgeting/budget-roles";
import { createRequestClient } from "@/lib/supabase/request";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  classification: z
    .enum(["essential", "discretionary", "giving", "savings"])
    .optional(),
  budget_role: z.enum(BUDGET_ROLES).optional(),
});

/**
 * Update a user-owned category through the authenticated RLS client. The
 * retired cross-project mirror is intentionally not written by user traffic.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(await request.json());
  if (!parsedBody.success || Object.keys(parsedBody.data).length === 0) {
    return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
  }

  const categoryId = parsedParams.data.id;

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

  const category = appResult.data;

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category, ledgerSynced: true });
}
