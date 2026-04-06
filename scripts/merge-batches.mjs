import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bahkswifojxcnesfcqbs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "36534d1b-8f48-4b5c-8693-aae1673a222c";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// Fetch all expenses
let all = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, amount, description, category_id, created_at, currency")
    .eq("user_id", USER_ID)
    .order("created_at")
    .range(from, from + 999);
  if (error) { console.error(error); process.exit(1); }
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}

const BATCH1_TS = "2026-04-04T00:31:02.022047+00:00"; // clean descriptions
const BATCH2_TS = "2026-04-04T23:03:44.431976+00:00"; // raw bank text

const batch1 = all.filter(e => e.created_at === BATCH1_TS);
const batch2 = all.filter(e => e.created_at === BATCH2_TS);

console.log(`Batch 1 (clean): ${batch1.length} rows`);
console.log(`Batch 2 (raw):   ${batch2.length} rows`);

// Build a pool of batch 1 entries indexed by (amount, date)
// Each key maps to an array so we handle legitimate same-day duplicates
const pool = new Map();
for (const e of batch1) {
  const key = e.amount + "|" + e.date;
  if (!pool.has(key)) pool.set(key, []);
  pool.get(key).push(e);
}

// For each batch 2 entry, check if there's an unmatched batch 1 entry
// If yes — the batch 2 entry is a duplicate with worse description; delete it
// If no — the batch 2 entry is unique (fills a gap); keep it
const batch2ToDelete = [];
const batch2ToKeep = [];

for (const e of batch2) {
  const key = e.amount + "|" + e.date;
  const matches = pool.get(key);
  if (matches && matches.length > 0) {
    matches.shift(); // consume one match
    batch2ToDelete.push(e);
  } else {
    batch2ToKeep.push(e);
  }
}

console.log(`\nBatch 2 entries matched to batch 1 (to delete): ${batch2ToDelete.length}`);
console.log(`Batch 2 entries unique (to keep): ${batch2ToKeep.length}`);
console.log(`Final expected total: ${batch1.length + batch2ToKeep.length}`);

// Show monthly breakdown of final result
const finalExpenses = [...batch1, ...batch2ToKeep];
const months = {};
const monthAmounts = {};
for (const e of finalExpenses) {
  const m = e.date.slice(0, 7);
  months[m] = (months[m] || 0) + 1;
  monthAmounts[m] = (monthAmounts[m] || 0) + e.amount;
}
console.log("\nProjected monthly totals after merge:");
Object.entries(months).sort().forEach(([m, c]) =>
  console.log(`  ${m}: ${c} expenses, EUR ${monthAmounts[m].toFixed(2)}`)
);
console.log(`  TOTAL: ${finalExpenses.length} expenses, EUR ${Object.values(monthAmounts).reduce((a,b)=>a+b,0).toFixed(2)}`);

if (process.argv.includes("--dry")) {
  console.log("\nDry run — no deletions performed.");
  process.exit(0);
}

// Delete the batch 2 duplicates
const idsToDelete = batch2ToDelete.map(e => e.id);
let deleted = 0;
for (let i = 0; i < idsToDelete.length; i += 100) {
  const batch = idsToDelete.slice(i, i + 100);
  const { error } = await supabase.from("expenses").delete().in("id", batch);
  if (error) { console.error("Delete error:", error); process.exit(1); }
  deleted += batch.length;
}

console.log(`\nMerge complete! Deleted ${deleted} overlapping batch 2 entries.`);
console.log(`Remaining: ${all.length - deleted} expenses`);
