import { normalizeForMatch } from "./normalize";

export interface CategorizationRule {
  match_type: "merchant_keyword" | "bank_category";
  pattern: string;
  category_id: string;
  priority: number;
}

export interface CategoryMatch {
  categoryId: string;
  matchType: "merchant_keyword" | "bank_category";
  pattern: string;
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
  const normalizedConcept = normalizeForMatch(concept);

  const keywordRules = rules
    .filter((rule) => rule.match_type === "merchant_keyword")
    .sort((a, b) => a.priority - b.priority);

  for (const rule of keywordRules) {
    if (normalizedConcept.includes(rule.pattern)) {
      return {
        categoryId: rule.category_id,
        matchType: "merchant_keyword",
        pattern: rule.pattern,
      };
    }
  }

  if (bankCategory) {
    const normalizedBankCategory = normalizeForMatch(bankCategory);
    for (const rule of rules) {
      if (
        rule.match_type === "bank_category" &&
        rule.pattern === normalizedBankCategory
      ) {
        return {
          categoryId: rule.category_id,
          matchType: "bank_category",
          pattern: rule.pattern,
        };
      }
    }
  }

  return null;
}
