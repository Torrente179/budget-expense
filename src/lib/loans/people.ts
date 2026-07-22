import type { SupabaseClient } from "@supabase/supabase-js";

/** Upsert a borrower into loan_people (unique per user + lowercased name). */
export async function upsertLoanPerson(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const { data: rows } = await supabase
    .from("loan_people")
    .select("id, name")
    .eq("user_id", userId);

  const existing = (rows ?? []).find(
    (row) => row.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (existing) {
    if (existing.name !== trimmed) {
      await supabase
        .from("loan_people")
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return;
  }

  const { error } = await supabase.from("loan_people").insert({
    user_id: userId,
    name: trimmed,
  });
  // Unique race: ignore duplicate
  if (error && error.code !== "23505") {
    console.error("upsertLoanPerson failed", error);
  }
}
