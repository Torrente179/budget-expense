#!/usr/bin/env node
/**
 * Parity gate: verifies src/lib/ledger/normalize.ts produces byte-identical
 * output to the Python originals in scripts/generate_santander_import.py.
 *
 * Cross-path dedupe between the Python SQL import and the in-app importer
 * matches on description text, so ANY divergence here is a Phase 1 blocker.
 *
 * Usage: node scripts/check-normalize-parity.mjs
 */
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptsDir, "..");

const ts = await import(
  new URL("../src/lib/ledger/normalize.ts", import.meta.url)
);

/** Representative Santander concepts covering every friendly_label branch. */
const CONCEPTS = [
  'Pago movil en MERCADONA VALENCIA, tarjeta 5402',
  '"Compra en AMAZON.ES, MADRID"',
  "Devolucion compra en ZARA HOME, tarjeta 1111",
  "Transferencia inmediata a favor de JUAN PEREZ GOMEZ, concepto: alquiler julio.",
  "Transferencia a favor de MARIA LOPEZ, concepto Sin Concepto",
  "Transferencia inmediata de ACME CORP SL, concepto: nomina junio",
  "Transferencia de WISE EUROPE SA, concepto: transfer",
  "Bizum a favor de PEDRO concepto: cena",
  "Bizum de ANA GARCIA concepto: regalo  compartido",
  "Ingreso anonimo contra cuenta, concepto: efectivo.",
  "Recibo tgss. cotizacion regimen autonomos",
  "RECIBO TGSS.COTIZACION SS",
  "Compra en CAFÉ MÜNCHEN, BERLIN",
  "pago movil en La Bodeguita   del medio, sevilla",
  "Un concepto sin patron que pasa directo, con coma",
  "  Espacios   raros \t y tabs  ",
  "Transferencia a favor de AEAT",
  "Compra en TIENDA AI TV SSP",
  "Bizum de JOSÉ MARÍA concepto: María cumpleaños",
  "Recibo tgss.",
];

const AMOUNTS = ['"1.234,56"', "12,50", "-987,65", '"-1.000,00"', "0,01"];
const DATES = ["01/07/26", "31/12/25", "29/02/24", '"15/06/26"'];

// --- Python side ---------------------------------------------------------
const pythonCode = `
import json, sys
sys.path.insert(0, ${JSON.stringify(scriptsDir)})
import generate_santander_import as g

data = json.load(sys.stdin)
out = {
    "labels": [g.friendly_label(c) for c in data["concepts"]],
    "matches": [g.normalize_for_match(c) for c in data["concepts"]],
    "cleaned": [g.clean_concept(c) for c in data["concepts"]],
    "amounts": [str(g.parse_amount(a)) for a in data["amounts"]],
    "dates": [g.parse_date(d) for d in data["dates"]],
}
print(json.dumps(out))
`;

const pyOut = JSON.parse(
  execFileSync("python3", ["-c", pythonCode], {
    cwd: root,
    input: JSON.stringify({ concepts: CONCEPTS, amounts: AMOUNTS, dates: DATES }),
    encoding: "utf8",
  })
);

// --- TS side -------------------------------------------------------------
const tsOut = {
  labels: CONCEPTS.map((c) => ts.friendlyLabel(c)),
  matches: CONCEPTS.map((c) => ts.normalizeForMatch(c)),
  cleaned: CONCEPTS.map((c) => ts.cleanConcept(c)),
  amounts: AMOUNTS.map((a) => ts.parseEuAmount(a).toFixed(2)),
  dates: DATES.map((d) => ts.parseEuDate(d)),
};

// Python Decimal str() keeps the scale of the input ("1234.56", "12.50");
// normalize both sides to fixed(2) for comparison.
pyOut.amounts = pyOut.amounts.map((a) => Number(a).toFixed(2));

// --- Diff ----------------------------------------------------------------
let failures = 0;
for (const section of ["labels", "matches", "cleaned", "amounts", "dates"]) {
  for (let i = 0; i < pyOut[section].length; i++) {
    if (pyOut[section][i] !== tsOut[section][i]) {
      failures++;
      console.error(`MISMATCH [${section}][${i}]`);
      console.error(`  input:  ${JSON.stringify(CONCEPTS[i] ?? AMOUNTS[i] ?? DATES[i])}`);
      console.error(`  python: ${JSON.stringify(pyOut[section][i])}`);
      console.error(`  ts:     ${JSON.stringify(tsOut[section][i])}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} parity failure(s). Do NOT ship the importer until fixed.`);
  process.exit(1);
}
console.log(
  `Parity OK: ${CONCEPTS.length} concepts × 3 functions + ${AMOUNTS.length} amounts + ${DATES.length} dates match Python exactly.`
);
