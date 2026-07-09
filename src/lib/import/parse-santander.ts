import { createHash } from "node:crypto";
import { parseCsv } from "./csv";
import type { ParsedMovement, ParseResult } from "./types";
import {
  cleanConcept,
  friendlyLabel,
  normalizeSpaces,
  parseEuAmount,
  parseEuDate,
  stripQuotes,
} from "../ledger/normalize";

/**
 * Parser for Santander's movimientos.csv export. Port of build_rows() in
 * scripts/generate_santander_import.py (columns: 0=date DD/MM/YY, 2=amount
 * EU format, 3=currency, 4=concept, 8=movement kind, 9=bank category).
 */
export function parseSantanderCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const movements: ParsedMovement[] = [];
  const skipped = { noComputable: 0, unknownKind: 0 };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 10) {
      throw new Error(
        `Row ${i + 1} has ${row.length} columns; expected at least 10 (is this a Santander movimientos.csv?)`
      );
    }

    const date = parseEuDate(row[0]);
    const amount = parseEuAmount(row[2]);
    const currency = stripQuotes(row[3]) || "EUR";
    const concept = cleanConcept(row[4]);
    const movementKind = normalizeSpaces(row[8]);
    const bankCategory = normalizeSpaces(row[9]);
    const label = friendlyLabel(concept);

    if (movementKind === "No computable") {
      skipped.noComputable++;
      continue;
    }

    // Raw row + index so identical legit rows in one file stay distinct.
    const externalRef = createHash("sha256")
      .update(JSON.stringify(row) + "#" + i)
      .digest("hex");

    if (movementKind === "Ingreso" || (movementKind === "Gasto" && amount > 0)) {
      movements.push({
        index: i,
        rowType: "income",
        date,
        amount: Math.abs(Number(amount.toFixed(2))),
        currency,
        description: concept,
        rawConcept: concept,
        source: label.slice(0, 100),
        externalRef,
      });
      continue;
    }

    if (movementKind !== "Gasto") {
      skipped.unknownKind++;
      continue;
    }

    movements.push({
      index: i,
      rowType: "expense",
      date,
      amount: Math.abs(Number(amount.toFixed(2))),
      currency,
      description: label,
      rawConcept: concept,
      bankCategory,
      externalRef,
    });
  }

  return { movements, skipped };
}
