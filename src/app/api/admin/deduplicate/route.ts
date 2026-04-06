import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  const { user } = await createRequestClient(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgerSupabase = createServiceRoleClient();

  if (!ledgerSupabase) {
    return NextResponse.json(
      { error: "Ledger project not configured" },
      { status: 503 }
    );
  }

  const ledgerUser = await resolveServiceRoleUserByEmail(user.email);

  if (!ledgerUser) {
    return NextResponse.json(
      { error: "User not found in ledger project" },
      { status: 404 }
    );
  }

  const dryRun = request.nextUrl.searchParams.get("dry") === "1";
  const effectiveUserId = ledgerUser.id;

  // Fetch ALL expenses for this user (handle >1000 rows with pagination)
  const allExpenses: Array<{
    id: string;
    amount: number;
    date: string;
    description: string | null;
    category_id: string;
    currency: string;
    created_at: string;
  }> = [];

  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await ledgerSupabase
      .from("expenses")
      .select("id, amount, date, description, category_id, currency, created_at")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch expenses", details: error.message },
        { status: 500 }
      );
    }

    allExpenses.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  // Group by the fields that define a unique expense
  const groups = new Map<string, typeof allExpenses>();

  for (const expense of allExpenses) {
    const key = [
      expense.amount,
      expense.date,
      expense.description ?? "",
      expense.category_id,
      expense.currency,
    ].join("|");

    const group = groups.get(key);

    if (group) {
      group.push(expense);
    } else {
      groups.set(key, [expense]);
    }
  }

  // For each group, keep only rows from the FIRST import batch.
  // The import script runs inside a transaction, so all rows from one run
  // share the same created_at. Rows from re-runs have a later created_at.
  const idsToDelete: string[] = [];

  for (const group of groups.values()) {
    if (group.length <= 1) {
      continue;
    }

    // Sort by created_at ascending (should already be sorted from query)
    group.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstBatchTime = group[0].created_at;

    // Keep all rows that share the first batch's created_at
    for (const expense of group) {
      if (expense.created_at !== firstBatchTime) {
        idsToDelete.push(expense.id);
      }
    }
  }

  if (dryRun) {
    return NextResponse.json({
      totalExpenses: allExpenses.length,
      duplicateGroups: [...groups.values()].filter((g) => g.length > 1).length,
      rowsToDelete: idsToDelete.length,
      rowsAfterDedup: allExpenses.length - idsToDelete.length,
      dryRun: true,
    });
  }

  // Delete in batches of 100 (PostgREST filter length limit)
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error } = await ledgerSupabase
      .from("expenses")
      .delete()
      .in("id", batch);

    if (error) {
      return NextResponse.json(
        {
          error: "Partial delete failure",
          deletedSoFar: deletedCount,
          remaining: idsToDelete.length - deletedCount,
          details: error.message,
        },
        { status: 500 }
      );
    }

    deletedCount += batch.length;
  }

  return NextResponse.json({
    totalBefore: allExpenses.length,
    duplicatesRemoved: deletedCount,
    totalAfter: allExpenses.length - deletedCount,
  });
}
