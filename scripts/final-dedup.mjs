import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bahkswifojxcnesfcqbs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "36534d1b-8f48-4b5c-8693-aae1673a222c";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// Ground truth from CSV
const CSV_COUNTS = {
  "2025-09": 73, "2025-10": 105, "2025-11": 126, "2025-12": 45,
  "2026-01": 71, "2026-02": 92, "2026-03": 149, "2026-04": 3,
};

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

const BATCH1_TS = "2026-04-04T00:31:02.022047+00:00";
const BATCH2_TS = "2026-04-04T23:03:44.431976+00:00";
const batch1 = all.filter(e => e.created_at === BATCH1_TS);
const batch2 = all.filter(e => e.created_at === BATCH2_TS);

console.log(`Batch 1 (clean): ${batch1.length} rows`);
console.log(`Batch 2 (raw):   ${batch2.length} rows`);

// Batch 1 monthly counts
const b1Counts = {};
batch1.forEach(e => { const m = e.date.slice(0, 7); b1Counts[m] = (b1Counts[m] || 0) + 1; });

// For each month, determine how many batch 2 entries we need to fill the gap
const keep = new Set();
const toDelete = [];

// Always keep all of batch 1
batch1.forEach(e => keep.add(e.id));

// For each month, figure out the gap
const allMonths = Object.keys(CSV_COUNTS);
for (const month of allMonths) {
  const csvCount = CSV_COUNTS[month];
  const b1Count = b1Counts[month] || 0;
  const gap = csvCount - b1Count;

  const b2MonthEntries = batch2.filter(e => e.date.startsWith(month));

  if (gap <= 0) {
    // Batch 1 fully covers this month — delete all batch 2 entries
    b2MonthEntries.forEach(e => toDelete.push(e));
    console.log(`${month}: B1 has ${b1Count}/${csvCount} — deleting all ${b2MonthEntries.length} B2 entries`);
  } else {
    // Need to fill the gap with batch 2 entries
    // First, remove batch 2 entries that overlap with batch 1 (same amount+date)
    const b1Pool = new Map();
    batch1.filter(e => e.date.startsWith(month)).forEach(e => {
      const key = e.amount + "|" + e.date;
      if (!b1Pool.has(key)) b1Pool.set(key, 0);
      b1Pool.set(key, b1Pool.get(key) + 1);
    });

    const unique = [];
    const overlapping = [];

    for (const e of b2MonthEntries) {
      const key = e.amount + "|" + e.date;
      const remaining = b1Pool.get(key) || 0;
      if (remaining > 0) {
        b1Pool.set(key, remaining - 1);
        overlapping.push(e);
      } else {
        unique.push(e);
      }
    }

    // Keep unique batch 2 entries up to the gap count
    const toKeepFromB2 = unique.slice(0, gap);
    const toDeleteFromB2 = [...overlapping, ...unique.slice(gap)];

    toKeepFromB2.forEach(e => keep.add(e.id));
    toDeleteFromB2.forEach(e => toDelete.push(e));

    console.log(`${month}: B1 has ${b1Count}/${csvCount}, gap=${gap} — keeping ${toKeepFromB2.length} B2, deleting ${toDeleteFromB2.length} B2`);
  }
}

// Also handle any batch 2 entries in months not in CSV (shouldn't exist, but just in case)
const b2Other = batch2.filter(e => !allMonths.some(m => e.date.startsWith(m)));
if (b2Other.length > 0) {
  console.log(`Other months: ${b2Other.length} B2 entries — keeping as-is`);
  b2Other.forEach(e => keep.add(e.id));
}

const finalCount = keep.size;
console.log(`\nFinal: ${finalCount} expenses to keep, ${toDelete.length} to delete`);

// Projected monthly totals
const finalExpenses = all.filter(e => keep.has(e.id));
const monthlyTotals = {};
const monthlyCounts = {};
for (const e of finalExpenses) {
  const m = e.date.slice(0, 7);
  monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
  monthlyTotals[m] = (monthlyTotals[m] || 0) + e.amount;
}

console.log("\nProjected vs CSV:");
console.log("Month     | Final Count | CSV Count | Final EUR   | CSV EUR");
for (const m of allMonths) {
  const fc = monthlyCounts[m] || 0;
  const cc = CSV_COUNTS[m];
  const ft = (monthlyTotals[m] || 0).toFixed(2);
  const match = fc === cc ? "OK" : "DIFF";
  console.log(`${m} | ${String(fc).padStart(11)} | ${String(cc).padStart(9)} | ${ft.padStart(11)} | ${match}`);
}
console.log(`TOTAL    | ${String(finalCount).padStart(11)} | ${String(664).padStart(9)} | ${Object.values(monthlyTotals).reduce((a,b)=>a+b,0).toFixed(2).padStart(11)} |`);

if (process.argv.includes("--dry")) {
  console.log("\nDry run — no deletions performed.");
  process.exit(0);
}

// Delete
const idsToDelete = toDelete.map(e => e.id);
let deleted = 0;
for (let i = 0; i < idsToDelete.length; i += 100) {
  const batch = idsToDelete.slice(i, i + 100);
  const { error } = await supabase.from("expenses").delete().in("id", batch);
  if (error) { console.error("Delete error:", error); process.exit(1); }
  deleted += batch.length;
}

console.log(`\nDone! Deleted ${deleted} entries. Remaining: ${all.length - deleted}`);
