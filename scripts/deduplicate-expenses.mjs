import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bahkswifojxcnesfcqbs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "36534d1b-8f48-4b5c-8693-aae1673a222c";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// Fetch ALL expenses (paginated)
const allExpenses = [];
let from = 0;
const pageSize = 1000;

while (true) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, date, description, category_id, currency, created_at")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Fetch error:", error);
    process.exit(1);
  }

  allExpenses.push(...data);
  if (data.length < pageSize) break;
  from += pageSize;
}

console.log(`Total expenses in DB: ${allExpenses.length}`);

// Group by unique expense signature
const groups = new Map();

for (const expense of allExpenses) {
  const key = [
    expense.amount,
    expense.date,
    expense.description ?? "",
    expense.category_id,
    expense.currency,
  ].join("|");

  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(expense);
}

// For each group with duplicates, keep only the first batch (same created_at)
const idsToDelete = [];
let dupGroupCount = 0;

for (const [key, group] of groups) {
  if (group.length <= 1) continue;
  dupGroupCount++;

  // Sort by created_at ascending
  group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const firstBatchTime = group[0].created_at;

  for (const expense of group) {
    if (expense.created_at !== firstBatchTime) {
      idsToDelete.push(expense.id);
    }
  }
}

console.log(`Duplicate groups found: ${dupGroupCount}`);
console.log(`Rows to delete: ${idsToDelete.length}`);
console.log(`Rows to keep: ${allExpenses.length - idsToDelete.length}`);

if (process.argv.includes("--dry")) {
  console.log("\nDry run — no deletions performed.");

  // Show some example duplicates
  let shown = 0;
  for (const [key, group] of groups) {
    if (group.length <= 1) continue;
    if (shown >= 5) break;
    console.log(`\n  Group (${group.length} copies): ${key.split("|").slice(0, 3).join(" | ")}`);
    for (const e of group) {
      const keep = e.created_at === group[0].created_at ? "KEEP" : "DELETE";
      console.log(`    ${keep}  id=${e.id.slice(0, 8)}  created_at=${e.created_at}`);
    }
    shown++;
  }
  process.exit(0);
}

// Delete in batches of 100
let deleted = 0;
for (let i = 0; i < idsToDelete.length; i += 100) {
  const batch = idsToDelete.slice(i, i + 100);
  const { error } = await supabase.from("expenses").delete().in("id", batch);

  if (error) {
    console.error(`Delete error at batch ${i}:`, error);
    console.log(`Deleted so far: ${deleted}`);
    process.exit(1);
  }

  deleted += batch.length;
}

console.log(`\nDeduplication complete!`);
console.log(`Deleted: ${deleted}`);
console.log(`Remaining: ${allExpenses.length - deleted}`);
