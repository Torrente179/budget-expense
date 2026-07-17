import { authorizedFetch } from "@/lib/query/authorized-fetch";

/** Fire-and-forget recurring materialization for a month. */
export async function syncRecurringMonth(month: number, year: number) {
  await authorizedFetch("/api/recurring/sync", {
    method: "POST",
    body: JSON.stringify({ month, year }),
  });
}
