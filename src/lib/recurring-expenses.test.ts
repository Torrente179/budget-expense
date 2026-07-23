import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRecurringStartDate } from "./recurring-expenses";

describe("resolveRecurringStartDate", () => {
  it("keeps the current month when the charge day is still upcoming", () => {
    const today = new Date(2026, 6, 18); // July 18
    assert.equal(resolveRecurringStartDate(25, today), "2026-07-01");
  });

  it("keeps the current month when the charge day is today", () => {
    const today = new Date(2026, 6, 18);
    assert.equal(resolveRecurringStartDate(18, today), "2026-07-01");
  });

  it("starts next month when the charge day already passed", () => {
    const today = new Date(2026, 6, 18);
    assert.equal(resolveRecurringStartDate(1, today), "2026-08-01");
  });

  it("rolls over the year in December", () => {
    const today = new Date(2026, 11, 20); // Dec 20
    assert.equal(resolveRecurringStartDate(5, today), "2027-01-01");
  });
});
