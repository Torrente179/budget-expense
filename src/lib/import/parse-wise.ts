import { createHash } from "node:crypto";
import { parseCsv } from "./csv";
import type { ParsedMovement, ParseResult } from "./types";
import { normalizeSpaces } from "../ledger/normalize";

/**
 * Parser for the standard Wise account-statement CSV export.
 * Header-driven (Wise reorders columns across export versions): requires
 * Date, Amount, Currency and uses Description/Merchant/Payee for the label.
 * Wise dates are DD-MM-YYYY; amounts use "." decimals and are signed
 * (negative = money out).
 */
export function parseWiseCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const dateCol = col("date");
  const amountCol = col("amount");
  const currencyCol = col("currency");
  const descriptionCol = col("description");
  const merchantCol = col("merchant");
  const payeeCol = col("payee name");
  const referenceCol = col("payment reference");

  if (dateCol < 0 || amountCol < 0 || currencyCol < 0) {
    throw new Error(
      "Missing Date/Amount/Currency columns (is this a Wise statement CSV?)"
    );
  }

  const movements: ParsedMovement[] = [];
  const skipped = { noComputable: 0, unknownKind: 0 };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[dateCol]?.trim() ?? "";
    const dateMatch = rawDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!dateMatch) {
      throw new Error(`Row ${i + 1}: cannot parse Wise date "${rawDate}"`);
    }
    const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount)) {
      throw new Error(`Row ${i + 1}: cannot parse amount "${row[amountCol]}"`);
    }
    if (amount === 0) {
      skipped.unknownKind++;
      continue;
    }

    const currency = row[currencyCol]?.trim() || "EUR";
    const label = normalizeSpaces(
      [
        row[descriptionCol]?.trim(),
        row[merchantCol]?.trim() || row[payeeCol]?.trim(),
        row[referenceCol]?.trim(),
      ]
        .filter(Boolean)
        .join(" - ")
    ).slice(0, 160);

    const externalRef = createHash("sha256")
      .update(JSON.stringify(row) + "#" + i)
      .digest("hex");

    movements.push({
      index: i,
      rowType: amount > 0 ? "income" : "expense",
      date,
      amount: Math.abs(Number(amount.toFixed(2))),
      currency,
      description: label || "Wise movement",
      rawConcept: label || "Wise movement",
      source: amount > 0 ? (label || "Wise").slice(0, 100) : undefined,
      externalRef,
    });
  }

  return { movements, skipped };
}
