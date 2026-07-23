import { normalizeForMatch } from "./normalize";

export interface CategorizationRule {
  match_type: "merchant_keyword" | "bank_category";
  pattern: string;
  category_id: string;
  priority: number;
}

export interface CategoryMatch {
  categoryId: string;
  matchType: "merchant_keyword" | "bank_category" | "history";
  pattern: string;
  confidence: number;
}

export interface CategorySuggestion extends CategoryMatch {
  name: string;
  icon: string;
  color: string;
  source: "rule" | "history";
}

/**
 * Two-tier matcher, semantics identical to classify_expense() in
 * scripts/generate_santander_import.py:
 * 1. merchant keyword rules (substring on the normalized concept), in
 *    priority order — first hit wins;
 * 2. bank-category rules (exact match on the normalized bank category).
 * Returns null when nothing matches (caller decides the fallback).
 */
export function matchCategory(
  concept: string,
  bankCategory: string | undefined,
  rules: CategorizationRule[]
): CategoryMatch | null {
  const matches = matchCategoryCandidates(concept, bankCategory, rules);
  return matches[0] ?? null;
}

/** All rule hits, best first (unique category ids). */
export function matchCategoryCandidates(
  concept: string,
  bankCategory: string | undefined,
  rules: CategorizationRule[]
): CategoryMatch[] {
  const normalizedConcept = normalizeForMatch(concept);
  const seen = new Set<string>();
  const matches: CategoryMatch[] = [];

  const keywordRules = rules
    .filter((rule) => rule.match_type === "merchant_keyword")
    .sort((a, b) => a.priority - b.priority);

  for (const rule of keywordRules) {
    if (!normalizedConcept.includes(rule.pattern)) continue;
    if (seen.has(rule.category_id)) continue;
    seen.add(rule.category_id);
    const confidence = Math.max(0.55, Math.min(0.98, 0.92 - rule.priority / 500));
    matches.push({
      categoryId: rule.category_id,
      matchType: "merchant_keyword",
      pattern: rule.pattern,
      confidence,
    });
  }

  if (bankCategory) {
    const normalizedBankCategory = normalizeForMatch(bankCategory);
    for (const rule of rules) {
      if (
        rule.match_type === "bank_category" &&
        rule.pattern === normalizedBankCategory &&
        !seen.has(rule.category_id)
      ) {
        seen.add(rule.category_id);
        matches.push({
          categoryId: rule.category_id,
          matchType: "bank_category",
          pattern: rule.pattern,
          confidence: 0.7,
        });
      }
    }
  }

  return matches;
}

export interface HistoryExpenseRow {
  category_id: string;
  description: string | null;
}

/**
 * Rank categories by how often similar past descriptions match the query.
 */
export function rankHistoryCategories(
  query: string,
  history: HistoryExpenseRow[],
  excludeCategoryIds: Set<string> = new Set()
): CategoryMatch[] {
  const normalizedQuery = normalizeForMatch(query);
  if (normalizedQuery.length < 3) return [];

  const queryTokens = new Set(
    normalizedQuery.split(" ").filter((token) => token.length >= 3)
  );

  const scores = new Map<string, { hits: number; bestOverlap: number }>();

  for (const row of history) {
    if (!row.category_id || excludeCategoryIds.has(row.category_id)) continue;
    const normalizedDesc = normalizeForMatch(row.description ?? "");
    if (!normalizedDesc) continue;

    const contains =
      normalizedDesc.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedDesc);

    const descTokens = normalizedDesc.split(" ").filter((token) => token.length >= 3);
    let overlap = 0;
    for (const token of descTokens) {
      if (queryTokens.has(token)) overlap += 1;
    }

    if (!contains && overlap === 0) continue;

    const current = scores.get(row.category_id) ?? { hits: 0, bestOverlap: 0 };
    current.hits += 1;
    current.bestOverlap = Math.max(current.bestOverlap, overlap + (contains ? 2 : 0));
    scores.set(row.category_id, current);
  }

  return [...scores.entries()]
    .map(([categoryId, score]) => ({
      categoryId,
      matchType: "history" as const,
      pattern: normalizedQuery,
      confidence: Math.min(0.85, 0.45 + score.hits * 0.08 + score.bestOverlap * 0.05),
      _hits: score.hits,
      _overlap: score.bestOverlap,
    }))
    .sort((a, b) => b.confidence - a.confidence || b._hits - a._hits)
    .map(({ categoryId, matchType, pattern, confidence }) => ({
      categoryId,
      matchType,
      pattern,
      confidence,
    }));
}

export function mergeSuggestionCandidates(
  ruleMatches: CategoryMatch[],
  historyMatches: CategoryMatch[],
  limit = 3
): Array<CategoryMatch & { source: "rule" | "history" }> {
  const merged: Array<CategoryMatch & { source: "rule" | "history" }> = [];
  const seen = new Set<string>();

  for (const match of ruleMatches) {
    if (seen.has(match.categoryId)) continue;
    seen.add(match.categoryId);
    merged.push({ ...match, source: "rule" });
  }
  for (const match of historyMatches) {
    if (seen.has(match.categoryId)) continue;
    seen.add(match.categoryId);
    merged.push({ ...match, source: "history" });
  }

  return merged
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
