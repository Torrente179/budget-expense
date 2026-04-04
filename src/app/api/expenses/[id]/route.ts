import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { expenseSchema } from "@/lib/validations";

const expenseUpdateSchema = expenseSchema.partial();

function normalizeDescription(description: string | null | undefined) {
  if (description === undefined) {
    return undefined;
  }

  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/expenses/[id]">
) {
  const { id } = await context.params;
  const parsed = expenseUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid expense update" },
      { status: 400 }
    );
  }

  const updates = {
    ...parsed.data,
    description: normalizeDescription(parsed.data.description),
  };

  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update expense", error);
    return NextResponse.json(
      { error: "Unable to update expense" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/expenses/[id]">
) {
  const { id } = await context.params;
  const { supabase, user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete expense", error);
    return NextResponse.json(
      { error: "Unable to delete expense" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
