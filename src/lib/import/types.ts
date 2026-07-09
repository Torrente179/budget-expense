export type ImportSourceFormat = "santander_csv" | "wise_csv";

export type ProposedRowStatus = "new" | "duplicate" | "uncategorized";

export type CategorySource =
  | "rule"
  | "bank"
  | "tithe"
  | "fallback"
  | "user"
  | "none";

/**
 * One parsed CSV movement inside an import batch. Persisted as JSONB on
 * import_batches.rows so the whole proposal stays auditable after commit.
 */
export interface ProposedRow {
  /** Stable id within the batch (CSV order). */
  index: number;
  rowType: "expense" | "income";
  date: string; // YYYY-MM-DD
  amount: number; // absolute, 2dp
  currency: string;
  /** Friendly label (expenses) / raw concept (income description). */
  description: string;
  rawConcept: string;
  /** Income only — friendly label truncated to 100 chars. */
  source?: string;
  bankCategory?: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySource: CategorySource;
  /** sha256 of the raw row + index; idempotency key across re-imports. */
  externalRef: string;
  status: ProposedRowStatus;
  /** User override: import even if duplicate / skip even if new. */
  include: boolean;
  needsReview: boolean;
  /** Set by review UI: persist a merchant rule from this categorization. */
  rememberRule?: boolean;
}

export interface ParsedMovement {
  index: number;
  rowType: "expense" | "income";
  date: string;
  amount: number;
  currency: string;
  description: string;
  rawConcept: string;
  source?: string;
  bankCategory?: string;
  externalRef: string;
}

export interface ParseResult {
  movements: ParsedMovement[];
  skipped: { noComputable: number; unknownKind: number };
}

export interface BatchCounts {
  new_count: number;
  duplicate_count: number;
  uncategorized_count: number;
}
