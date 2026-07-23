import { NextRequest, NextResponse } from "next/server";
import {
  matchCategoryCandidates,
  mergeSuggestionCandidates,
  rankHistoryCategories,
} from "@/lib/ledger/categorize";
import { resolveLedgerContext } from "@/lib/supabase/ledger";

/**
 * Suggest categories for a merchant/description as the user types.
 * Combines rule matches with recent expense history (no ML).
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json({ suggestion: null, suggestions: [] });
  }

  const ledger = await resolveLedgerContext(request);
  if (!ledger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: rules }, { data: history }] = await Promise.all([
    ledger.supabase
      .from("categorization_rules")
      .select("match_type, pattern, category_id, priority")
      .eq("user_id", ledger.userId),
    ledger.supabase
      .from("expenses")
      .select("category_id, description")
      .eq("user_id", ledger.userId)
      .order("date", { ascending: false })
      .limit(250),
  ]);

  const ruleMatches = matchCategoryCandidates(query, undefined, rules ?? []);
  const historyMatches = rankHistoryCategories(
    query,
    (history ?? []).map((row) => ({
      category_id: row.category_id,
      description: row.description,
    })),
    new Set(ruleMatches.map((match) => match.categoryId))
  );

  const ranked = mergeSuggestionCandidates(ruleMatches, historyMatches, 3);
  if (ranked.length === 0) {
    return NextResponse.json({ suggestion: null, suggestions: [] });
  }

  const categoryIds = ranked.map((match) => match.categoryId);
  const { data: categories } = await ledger.supabase
    .from("categories")
    .select("id, name, icon, color")
    .in("id", categoryIds);

  const byId = new Map((categories ?? []).map((category) => [category.id, category]));
  const suggestions = ranked
    .map((match) => {
      const category = byId.get(match.categoryId);
      if (!category) return null;
      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        source: match.source,
        confidence: match.confidence,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return NextResponse.json({
    suggestion: suggestions[0] ?? null,
    suggestions,
  });
}
