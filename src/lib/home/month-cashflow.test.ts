import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveHomeAvailableBalance,
  resolveMonthCashflow,
} from "./month-cashflow";

test("Home carries the tracked July closing balance into August", () => {
  const august = resolveMonthCashflow({
    monthlyIncome: 647.53,
    actualOutflows: 508.31,
    daysInMonth: 31,
    currentDay: 11,
    isCurrentMonth: true,
  });

  assert.equal(august.remaining, 139.22);

  const available = resolveHomeAvailableBalance({
    trackedBalance: 507.81,
    monthlyRemaining: august.remaining,
    daysRemaining: august.daysRemaining,
  });

  assert.equal(available.amount, 507.81);
  assert.equal(available.source, "tracked");
  assert.ok(
    available.dailyAvailable != null &&
      Math.abs(available.dailyAvailable - 25.3905) < 1e-9
  );
});

test("Home falls back to month cashflow when balance tracking is absent", () => {
  assert.deepEqual(
    resolveHomeAvailableBalance({
      trackedBalance: null,
      monthlyRemaining: 139.22,
      daysRemaining: 20,
    }),
    {
      amount: 139.22,
      dailyAvailable: 6.961,
      source: "monthly_cashflow",
    }
  );
});

test("Home never recommends spending from a negative tracked balance", () => {
  assert.deepEqual(
    resolveHomeAvailableBalance({
      trackedBalance: -12.34,
      monthlyRemaining: 100,
      daysRemaining: 10,
    }),
    {
      amount: -12.34,
      dailyAvailable: 0,
      source: "tracked",
    }
  );
});

test("Home remains unavailable when neither balance source exists", () => {
  assert.deepEqual(
    resolveHomeAvailableBalance({
      trackedBalance: null,
      monthlyRemaining: null,
      daysRemaining: 10,
    }),
    {
      amount: null,
      dailyAvailable: null,
      source: "unavailable",
    }
  );
});
