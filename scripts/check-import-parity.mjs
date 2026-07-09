#!/usr/bin/env node
/**
 * End-to-end import parity gate: runs a synthetic movimientos.csv through
 * BOTH pipelines — Python (build_rows + assign_tithe_from_wise_transfers)
 * and TypeScript (parseSantanderCsv + matchCategory + assignTithes) — and
 * requires identical row types, dates, amounts, descriptions, categories,
 * and tithe assignments.
 *
 * Usage: node scripts/check-import-parity.mjs [path/to/real/movimientos.csv]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));

const { parseSantanderCsv } = await import(
  new URL("../src/lib/import/parse-santander.ts", import.meta.url)
);
const { matchCategory } = await import(
  new URL("../src/lib/ledger/categorize.ts", import.meta.url)
);
const { assignTithes } = await import(
  new URL("../src/lib/import/tithe-match.ts", import.meta.url)
);

// --- fixture CSV (10 columns like Santander's export) ---------------------
function row(date, amount, currency, concept, kind, bankCategory) {
  return [date, "x", amount, currency, concept, "", "", "", kind, bankCategory]
    .map((cell) => `"${cell}"`)
    .join(",");
}

const FIXTURE = [
  '"Fecha","x","Importe","Moneda","Concepto","a","b","c","Tipo","Categoria"',
  row("01/06/26", "1.500,00", "EUR", "Transferencia de ACME CORP SL, concepto: nomina junio", "Ingreso", "Ingresos"),
  row("02/06/26", "-84,37", "EUR", "Pago movil en MERCADONA VALENCIA, tarjeta 5402", "Gasto", "Supermercados"),
  row("03/06/26", "-151,20", "EUR", "Transferencia inmediata a favor de WISE EUROPE SA, concepto: ahorro", "Gasto", "Transferencias"),
  row("04/06/26", "-300,00", "EUR", "Traspaso a cuenta propia", "No computable", "Traspasos"),
  row("05/06/26", "12,99", "EUR", "Devolucion compra en ZARA HOME, tarjeta 1111", "Gasto", "Compras"),
  row("06/06/26", "-95,00", "EUR", "Recibo tgss. cotizacion regimen autonomos", "Gasto", "Impuestos"),
  row("08/06/26", "-42,10", "EUR", "Compra en RESTAURANTE LA TASCA, MADRID", "Gasto", "Restaurante"),
  row("09/06/26", "-17,55", "EUR", "Compra en COMERCIO DESCONOCIDO XYZ", "Gasto", "Sin categorizar"),
  row("15/06/26", "2.000,00", "EUR", "Transferencia inmediata de CLIENTE SL, concepto: factura 12", "Ingreso", "Ingresos"),
  row("17/06/26", "-198,75", "EUR", "Bizum a favor de WISE concepto: diezmo", "Gasto", "Transferencias"),
  row("01/07/26", "-60,00", "EUR", "Transferencia a favor de WISE EUROPE SA", "Gasto", "Transferencias"),
  row("02/07/26", "600,00", "EUR", "Bizum de ANA GARCIA concepto: alquiler habitacion", "Ingreso", "Ingresos"),
].join("\n");

const csvPath = process.argv[2] ?? join(tmpdir(), "parity-movimientos.csv");
if (!process.argv[2]) writeFileSync(csvPath, FIXTURE, "utf8");
const csvText = readFileSync(csvPath, "utf8");

// --- Python side -----------------------------------------------------------
const pythonCode = `
import json, sys
sys.path.insert(0, ${JSON.stringify(scriptsDir)})
import generate_santander_import as g

expenses, incomes, stats = g.build_rows(__import__("pathlib").Path(${JSON.stringify(csvPath)}))
expenses, tithe_count = g.assign_tithe_from_wise_transfers(expenses, incomes)
print(json.dumps({
    "expenses": [
        {"category": e.category_name, "amount": str(e.amount), "currency": e.currency,
         "description": e.description, "date": e.date}
        for e in expenses
    ],
    "incomes": [
        {"source": i.source, "amount": str(i.amount), "currency": i.currency,
         "description": i.description, "date": i.date}
        for i in incomes
    ],
    "tithe_count": tithe_count,
    "skipped_no_computable": stats["skipped_no_computable"],
}))
`;
const py = JSON.parse(
  execFileSync("python3", ["-c", pythonCode], { encoding: "utf8" })
);

// --- TS side ---------------------------------------------------------------
const maps = JSON.parse(
  execFileSync(
    "python3",
    [
      "-c",
      `import json, sys; sys.path.insert(0, ${JSON.stringify(scriptsDir)});\nimport generate_santander_import as g\nprint(json.dumps({"patterns": [[name, list(p)] for name, p in g.PATTERN_RULES], "bank": g.BANK_CATEGORY_MAP}))`,
    ],
    { encoding: "utf8" }
  )
);

// Category ids == names, so proposals compare directly against Python names.
const rules = [];
let priority = 10;
for (const [name, patterns] of maps.patterns) {
  for (const pattern of patterns) {
    rules.push({ match_type: "merchant_keyword", pattern, category_id: name, priority });
  }
  priority += 10;
}
for (const [pattern, name] of Object.entries(maps.bank)) {
  rules.push({ match_type: "bank_category", pattern, category_id: name, priority: 1000 });
}

const parsed = parseSantanderCsv(csvText);
const tsRows = parsed.movements.map((movement) => {
  if (movement.rowType === "income") {
    return { ...movement, categoryId: null, categoryName: null, categorySource: "none", status: "new", include: true, needsReview: false };
  }
  const match = matchCategory(movement.rawConcept, movement.bankCategory, rules);
  const categoryId = match?.categoryId ?? "Other";
  return { ...movement, categoryId, categoryName: categoryId, categorySource: match ? "rule" : "fallback", status: "new", include: true, needsReview: !match };
});
const tsTitheCount = assignTithes(tsRows, "Tithe / Diezmo", "Tithe / Diezmo");

// --- Compare ---------------------------------------------------------------
let failures = 0;
const fail = (message) => {
  failures++;
  console.error("MISMATCH: " + message);
};

const tsExpenses = tsRows.filter((row) => row.rowType === "expense");
const tsIncomes = tsRows.filter((row) => row.rowType === "income");

if (tsExpenses.length !== py.expenses.length)
  fail(`expense count ts=${tsExpenses.length} py=${py.expenses.length}`);
if (tsIncomes.length !== py.incomes.length)
  fail(`income count ts=${tsIncomes.length} py=${py.incomes.length}`);
if (tsTitheCount !== py.tithe_count)
  fail(`tithe count ts=${tsTitheCount} py=${py.tithe_count}`);
if (parsed.skipped.noComputable !== py.skipped_no_computable)
  fail(`skipped ts=${parsed.skipped.noComputable} py=${py.skipped_no_computable}`);

for (let i = 0; i < Math.min(tsExpenses.length, py.expenses.length); i++) {
  const ts = tsExpenses[i];
  const p = py.expenses[i];
  if (ts.date !== p.date) fail(`expense[${i}] date ${ts.date} != ${p.date}`);
  if (ts.amount.toFixed(2) !== Number(p.amount).toFixed(2))
    fail(`expense[${i}] amount ${ts.amount} != ${p.amount}`);
  if (ts.description !== p.description)
    fail(`expense[${i}] description ${JSON.stringify(ts.description)} != ${JSON.stringify(p.description)}`);
  if (ts.categoryId !== p.category)
    fail(`expense[${i}] category ${ts.categoryId} != ${p.category} (${ts.description})`);
}

for (let i = 0; i < Math.min(tsIncomes.length, py.incomes.length); i++) {
  const ts = tsIncomes[i];
  const p = py.incomes[i];
  if (ts.date !== p.date) fail(`income[${i}] date ${ts.date} != ${p.date}`);
  if (ts.amount.toFixed(2) !== Number(p.amount).toFixed(2))
    fail(`income[${i}] amount ${ts.amount} != ${p.amount}`);
  if (ts.source !== p.source) fail(`income[${i}] source ${JSON.stringify(ts.source)} != ${JSON.stringify(p.source)}`);
  if (ts.description !== p.description)
    fail(`income[${i}] description ${JSON.stringify(ts.description)} != ${JSON.stringify(p.description)}`);
}

if (failures > 0) {
  console.error(`\n${failures} import-parity failure(s).`);
  process.exit(1);
}
console.log(
  `Import parity OK: ${tsExpenses.length} expenses, ${tsIncomes.length} incomes, ${tsTitheCount} tithes, ${parsed.skipped.noComputable} skipped — identical across Python and TS.`
);
