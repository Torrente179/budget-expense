import { normalizeForMatch } from "./normalize";

const NOISE_TOKENS = new Set([
  "recibo",
  "compra",
  "pago",
  "pagos",
  "transfer",
  "transferencia",
  "transferencias",
  "inmediata",
  "favor",
  "de",
  "a",
  "en",
  "el",
  "la",
  "los",
  "las",
  "del",
  "al",
  "y",
  "con",
  "por",
  "concepto",
  "ref",
  "referencia",
  "mandato",
  "comision",
  "tarjeta",
  "card",
  "bizum",
  "from",
  "to",
  "the",
  "and",
  "of",
  "sa",
  "sl",
  "no",
  "num",
  "total",
  "eur",
  "usd",
  "cop",
]);

/**
 * Pull a short, reusable merchant keyword from a raw bank description.
 * Used when learning user categorization rules so we don't store the full line.
 */
export function extractMerchantPattern(description: string): string | null {
  let text = normalizeForMatch(description);
  if (!text) return null;

  text = text
    .replace(/\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\bcomision\b.*$/g, " ")
    .replace(/\bn[o0]\s*recibo\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = text
    .split(" ")
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 3 &&
        !NOISE_TOKENS.has(token) &&
        !/^\d+$/.test(token)
    );

  if (tokens.length === 0) return null;

  const pattern = tokens.slice(0, 3).join(" ");
  if (pattern.length < 3) return null;
  return pattern.slice(0, 80);
}
