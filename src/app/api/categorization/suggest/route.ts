import { NextRequest, NextResponse } from "next/server";
import { matchCategory } from "@/lib/ledger/categorize";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

/**
 * Suggest a category for a merchant/description as the user types.
 * Thin read over categorization_rules using the same matcher as the importer.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json({ suggestion: null });
  }

  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await ledger.supabase
    .from("categorization_rules")
    .select("match_type, pattern, category_id, priority")
    .eq("user_id", ledger.userId);

  // Rules table missing (migration pending) or empty → no suggestion.
  if (error || !data || data.length === 0) {
    return NextResponse.json({ suggestion: null });
  }

  const match = matchCategory(query, undefined, data);
  if (!match) {
    return NextResponse.json({ suggestion: null });
  }

  const { data: category } = await ledger.supabase
    .from("categories")
    .select("id, name, icon, color")
    .eq("id", match.categoryId)
    .maybeSingle();

  return NextResponse.json({
    suggestion: category
      ? { categoryId: category.id, name: category.name, icon: category.icon, color: category.color }
      : null,
  });
}
