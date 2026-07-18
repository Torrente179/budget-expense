import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateBalanceMovements,
  calculateTrackedBalance,
  isMovementAfterCheckpoint,
  type BalanceCheckpointRecord,
  type BalanceMovement,
} from "./balance-checkpoint";
import { parseLocalizedCurrencyInput } from "./utils";

const checkpoint: BalanceCheckpointRecord = {
  balance: 7_025_963.5,
  currency: "COP",
  as_of_date: "2026-07-18",
  created_at: "2026-07-18T12:00:00.000Z",
  calculated_balance_before: -2_765_634.38,
  reconciliation_delta: 9_791_597.88,
  calculation_start_date: "2026-07-01",
  calculation_basis: "monthly_net",
};

function movement(
  date: string,
  createdAt: string,
  amount = 100
): BalanceMovement {
  return { amount, currency: "COP", date, created_at: createdAt };
}

test("same-day ordering uses server creation time", () => {
  assert.equal(
    isMovementAfterCheckpoint(
      movement("2026-07-18", "2026-07-18T11:59:59.999Z"),
      checkpoint
    ),
    false
  );
  assert.equal(
    isMovementAfterCheckpoint(
      movement("2026-07-18", "2026-07-18T12:00:00.000Z"),
      checkpoint
    ),
    false
  );
  assert.equal(
    isMovementAfterCheckpoint(
      movement("2026-07-18", "2026-07-18T12:00:00.001Z"),
      checkpoint
    ),
    true
  );
});

test("movement date takes priority over later ingestion time", () => {
  assert.equal(
    isMovementAfterCheckpoint(
      movement("2026-07-17", "2026-07-19T12:00:00.000Z"),
      checkpoint
    ),
    false
  );
  assert.equal(
    isMovementAfterCheckpoint(
      movement("2026-07-19", "2026-07-18T11:00:00.000Z"),
      checkpoint
    ),
    true
  );
});

test("currency aggregation is exact to ledger cents past 1,000 rows", () => {
  const rows = Array.from({ length: 1_501 }, (_, index) =>
    movement("2026-07-19", "2026-07-19T12:00:00.000Z", index % 2 ? 0.1 : 0.2)
  );
  assert.deepEqual(aggregateBalanceMovements(rows), [
    { currency: "COP", amount: 225.2 },
  ]);
});

test("Doralis checkpoint stays separate from later cash flow", () => {
  const tracked = calculateTrackedBalance({
    checkpoint,
    totals: {
      incomes: [{ currency: "COP", amount: 500 }],
      expenses: [{ currency: "COP", amount: 125.25 }],
      investmentTransfers: [{ currency: "COP", amount: 74.75 }],
    },
    convert: (amount) => amount,
  });

  assert.equal(tracked, 7_026_263.5);
  assert.equal(Number(checkpoint.reconciliation_delta), 9_791_597.88);
});

test("no checkpoint never becomes a plausible zero balance", () => {
  assert.equal(
    calculateTrackedBalance({
      checkpoint: null,
      totals: { incomes: [], expenses: [], investmentTransfers: [] },
      convert: (amount) => amount,
    }),
    null
  );
});

test("localized currency parsing preserves grouped COP amounts", () => {
  assert.equal(parseLocalizedCurrencyInput("7.025.963", "es-CO"), 7_025_963);
  assert.equal(
    parseLocalizedCurrencyInput("7.025.963,50", "es-CO"),
    7_025_963.5
  );
  assert.equal(parseLocalizedCurrencyInput("7,025,963", "en-US"), 7_025_963);
  assert.equal(
    parseLocalizedCurrencyInput("7,025,963.50", "en-US"),
    7_025_963.5
  );
  assert.ok(Number.isNaN(parseLocalizedCurrencyInput("7.0250", "es-CO")));
});
