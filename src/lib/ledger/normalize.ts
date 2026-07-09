/**
 * TypeScript port of the text-normalization helpers in
 * scripts/generate_santander_import.py (lines ~344-489).
 *
 * PARITY IS LOAD-BEARING: descriptions produced here must be byte-identical
 * to the Python script's output, because cross-path deduplication between the
 * script-generated SQL and the in-app importer matches on the description
 * field. Run `node scripts/check-normalize-parity.mjs` after touching this
 * file (or the Python originals).
 */

export function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** NFKD → strip combining marks → collapse spaces → lowercase. */
export function normalizeForMatch(value: string): string {
  const simplified = value.normalize("NFKD");
  const asciiOnly = simplified.replace(/\p{M}/gu, "");
  return normalizeSpaces(asciiOnly).toLowerCase();
}

export function stripQuotes(value: string): string {
  return value.trim().replace(/^"+|"+$/g, "").trim();
}

/** Parses EU-format amounts: "1.234,56" → 1234.56 */
export function parseEuAmount(value: string): number {
  const normalized = stripQuotes(value).replaceAll(".", "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Cannot parse amount: ${value}`);
  }
  return parsed;
}

/** Parses "DD/MM/YY" → "YYYY-MM-DD" (2000-pivot like Python's %y). */
export function parseEuDate(value: string): string {
  const match = stripQuotes(value).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) {
    throw new Error(`Cannot parse date: ${value}`);
  }
  const [, day, month, yy] = match;
  const yearNum = Number(yy);
  // Python strptime %y: 00-68 → 2000s, 69-99 → 1900s
  const year = yearNum <= 68 ? 2000 + yearNum : 1900 + yearNum;
  return `${year}-${month}-${day}`;
}

export function cleanConcept(value: string): string {
  const cleaned = normalizeSpaces(stripQuotes(value));
  return cleaned.replace(/[.,]+$/, "");
}

const FORCED_UPPER = new Set(["ai", "tgss", "aeat", "tv", "ssp"]);

/** Python str.isupper(): true if it has cased chars and all cased are upper. */
function isUpperLikePython(token: string): boolean {
  return /\p{Lu}/u.test(token) && !/\p{Ll}/u.test(token);
}

/** Python str.capitalize(): first char upper, REST lowered. */
function capitalizeLikePython(token: string): string {
  if (token.length === 0) return token;
  return token[0].toUpperCase() + token.slice(1).toLowerCase();
}

export function smartTitle(value: string): string {
  const tokens = value.split(/(\s+)/).filter((token) => token.length > 0);
  const titled: string[] = [];
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      titled.push(token);
      continue;
    }
    if (isUpperLikePython(token) && token.length > 1) {
      titled.push(token);
    } else if (FORCED_UPPER.has(token.toLowerCase())) {
      titled.push(token.toUpperCase());
    } else {
      titled.push(capitalizeLikePython(token));
    }
  }
  return titled.join("");
}

export function compactSuffix(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = normalizeSpaces(value).replace(/^[ .,-]+|[ .,-]+$/g, "");
  if (!cleaned) return null;
  const normalized = normalizeForMatch(cleaned);
  if (normalized === "sin concepto" || normalized === "concepto sin concepto") {
    return null;
  }
  return cleaned;
}

function buildTransferLabel(
  prefix: string,
  name: string,
  detail: string | null = null
): string {
  const base = `${prefix} ${smartTitle(normalizeSpaces(name))}`.trim();
  return detail ? `${base} - ${detail}` : base;
}

interface LabelPattern {
  regex: RegExp;
  build: (match: RegExpMatchArray) => string;
}

const LABEL_PATTERNS: LabelPattern[] = [
  {
    regex: /^pago movil en ([^,]+)/i,
    build: (m) => smartTitle(m[1]),
  },
  {
    regex: /^compra en ([^,]+)/i,
    build: (m) => smartTitle(m[1]),
  },
  {
    regex: /^devolucion compra en ([^,]+)/i,
    build: (m) => `Refund - ${smartTitle(m[1])}`,
  },
  {
    regex: /^transferencia inmediata a favor de ([^,]+?)(?:, concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Transfer to", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^transferencia a favor de ([^,]+?)(?:,? concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Transfer to", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^transferencia inmediata de ([^,]+?)(?:, concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Transfer from", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^transferencia de ([^,]+?)(?:, concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Transfer from", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^bizum a favor de ([^,]+?)(?: concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Bizum to", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^bizum de ([^,]+?)(?: concepto:? ?(.*))?$/i,
    build: (m) => buildTransferLabel("Bizum from", m[1], compactSuffix(m[2])),
  },
  {
    regex: /^ingreso anonimo contra cuenta.*?(?:concepto:? ?(.*))?$/i,
    build: (m) =>
      buildTransferLabel("Cash deposit", "", compactSuffix(m[1])).replace(
        /[ -]+$/g,
        ""
      ),
  },
  {
    regex: /^recibo tgss\.(.*)$/i,
    build: (m) => `TGSS ${compactSuffix(m[1]) ?? "charge"}`,
  },
];

export function friendlyLabel(rawConcept: string): string {
  const concept = cleanConcept(rawConcept);

  for (const { regex, build } of LABEL_PATTERNS) {
    const match = concept.match(regex);
    if (match) {
      return normalizeSpaces(build(match)).slice(0, 160);
    }
  }

  return concept.slice(0, 160);
}
