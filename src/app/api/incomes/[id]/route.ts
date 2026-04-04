import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request";
import { incomeSchema } from "@/lib/validations";

const incomeUpdateSchema = incomeSchema.partial();

function normalizeDescription(description: string | null | undefined) {
  if (description === undefined) {
    return undefined;
  }

  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/incomes/[id]">
) {
  const { id } = await context.params;
  const parsed = incomeUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid income update" },
      { status: 400 }
    );
  }

  const updates = {
    ...parsed.data,
    source: parsed.data.source?.trim(),
    description: normalizeDescription(parsed.data.description),
  };

  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("income_entries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update income entry", error);
    return NextResponse.json(
      { error: "Unable to update income entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/incomes/[id]">
) {
  const { id } = await context.params;
  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete income entry", error);
    return NextResponse.json(
      { error: "Unable to delete income entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
