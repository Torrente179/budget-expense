import assert from "node:assert/strict";
import test from "node:test";
import {
  accountBalance,
  computeAvailableMoney,
  computeCushion,
  computeMonthlyChange,
  computeNetWorth,
  previousMonthEnd,
  resolveCushionTone,
  resolvePreviousMonthClosing,
  resolveTrendSeries,
  sumAccountsBase,
  sumLoansOutstandingBase,
  type NetWorthSnapshotPoint,
} from "./net-worth";

/** Identity conversion: these tests are about the arithmetic, not FX. */
const identity = (amount: number) => amount;

test("computeNetWorth matches the worked example from the spec", () => {
  const totals = computeNetWorth({
    accountsAndCash: 2500,
    savings: 3000,
    investments: 10000,
    moneyLent: 800,
    debts: 6350,
  });

  assert.equal(totals.totalAssets, 16300);
  assert.equal(totals.totalLiabilities, 6350);
  assert.equal(totals.netWorth, 9950);
});

test("computeNetWorth handles an empty balance sheet without dividing by zero", () => {
  const totals = computeNetWorth({
    accountsAndCash: 0,
    savings: 0,
    investments: 0,
    moneyLent: 0,
    debts: 0,
  });

  assert.equal(totals.netWorth, 0);
  assert.equal(totals.assetsShare, 0);
  assert.equal(totals.liabilitiesShare, 0);
});

test("a debts-only balance sheet gives a negative net worth", () => {
  const totals = computeNetWorth({
    accountsAndCash: 0,
    savings: 0,
    investments: 0,
    moneyLent: 0,
    debts: 1250,
  });

  assert.equal(totals.netWorth, -1250);
  assert.equal(totals.liabilitiesShare, 1);
});

test("available money excludes accounts not marked available", () => {
  const available = computeAvailableMoney({
    accounts: [
      { balance: 2500, includeInAvailable: true },
      { balance: 3000, includeInAvailable: false },
    ],
  });

  assert.equal(available, 2500);
});

test("available money subtracts reserved plan amounts", () => {
  const available = computeAvailableMoney({
    accounts: [{ balance: 2500, includeInAvailable: true }],
    savingsAvailable: 500,
    reserved: 400,
  });

  assert.equal(available, 2600);
});

test("moving money to savings leaves net worth untouched", () => {
  const before = computeNetWorth({
    accountsAndCash: 1000,
    savings: 0,
    investments: 0,
    moneyLent: 0,
    debts: 0,
  });
  const after = computeNetWorth({
    accountsAndCash: 700,
    savings: 300,
    investments: 0,
    moneyLent: 0,
    debts: 0,
  });

  assert.equal(before.netWorth, after.netWorth);
  assert.equal(before.totalAssets, after.totalAssets);
});

test("lending money moves it between assets without changing net worth", () => {
  const before = computeNetWorth({
    accountsAndCash: 1000,
    savings: 0,
    investments: 0,
    moneyLent: 0,
    debts: 0,
  });
  const after = computeNetWorth({
    accountsAndCash: 200,
    savings: 0,
    investments: 0,
    moneyLent: 800,
    debts: 0,
  });

  assert.equal(after.netWorth, before.netWorth);
});

test("monthly change is null-safe when there is no prior snapshot", () => {
  const change = computeMonthlyChange(9950, null);

  assert.equal(change.amount, null);
  assert.equal(change.percentage, null);
});

test("a zero previous month yields an amount but never an infinite percentage", () => {
  const change = computeMonthlyChange(420, 0);

  assert.equal(change.amount, 420);
  assert.equal(change.percentage, null);
});

test("monthly change percentage uses the absolute previous value", () => {
  const change = computeMonthlyChange(-500, -1000);

  assert.equal(change.amount, 500);
  assert.equal(change.percentage, 0.5);
});

test("previousMonthEnd rolls back across a year boundary", () => {
  assert.equal(previousMonthEnd("2026-01-15"), "2025-12-31");
  assert.equal(previousMonthEnd("2026-03-01"), "2026-02-28");
  assert.equal(previousMonthEnd("2024-03-10"), "2024-02-29");
});

const series: NetWorthSnapshotPoint[] = [
  { asOfDate: "2026-05-20", netWorth: 8000, totalAssets: 8000, totalLiabilities: 0 },
  { asOfDate: "2026-06-28", netWorth: 9530, totalAssets: 9530, totalLiabilities: 0 },
  { asOfDate: "2026-07-24", netWorth: 9950, totalAssets: 9950, totalLiabilities: 0 },
];

test("previous closing takes the latest snapshot on or before last month's end", () => {
  // June never got a 30th; the 28th is the honest closing value.
  assert.equal(resolvePreviousMonthClosing(series, "2026-07-25"), 9530);
});

test("previous closing is null when history starts this month", () => {
  const thisMonthOnly = [series[2]];
  assert.equal(resolvePreviousMonthClosing(thisMonthOnly, "2026-07-25"), null);
});

test("trend series filters by range and stays sorted", () => {
  const oneMonth = resolveTrendSeries({
    snapshots: series,
    range: "1M",
    today: "2026-07-25",
  });
  assert.deepEqual(
    oneMonth.map((point) => point.asOfDate),
    ["2026-06-28", "2026-07-24"]
  );

  const all = resolveTrendSeries({
    snapshots: [...series].reverse(),
    range: "ALL",
    today: "2026-07-25",
  });
  assert.deepEqual(
    all.map((point) => point.asOfDate),
    ["2026-05-20", "2026-06-28", "2026-07-24"]
  );
});

test("account balance is opening plus signed movements", () => {
  const balance = accountBalance(
    { opening_balance: 2500, currency: "EUR" },
    [{ amount: 300 }, { amount: -120 }]
  );

  assert.equal(balance, 2680);
});

test("sumAccountsBase skips archived and closed accounts", () => {
  const total = sumAccountsBase(
    [
      { id: "a", opening_balance: 1000, currency: "EUR", status: "active" },
      { id: "b", opening_balance: 500, currency: "EUR", status: "archived" },
      { id: "c", opening_balance: 250, currency: "EUR", status: "closed" },
    ],
    [{ account_id: "a", amount: -100 }],
    identity
  );

  assert.equal(total, 900);
});

test("loan outstanding floors at zero when overpaid", () => {
  const total = sumLoansOutstandingBase(
    [{ id: "l1", principal: 1000, currency: "EUR", is_active: true }],
    [
      { loan_id: "l1", amount: 600 },
      { loan_id: "l1", amount: 600 },
    ],
    identity
  );

  assert.equal(total, 0);
});

test("inactive loans are not assets", () => {
  const total = sumLoansOutstandingBase(
    [{ id: "l1", principal: 1000, currency: "EUR", is_active: false }],
    [],
    identity
  );

  assert.equal(total, 0);
});

test("cushion divides liquid savings by essential spend", () => {
  const cushion = computeCushion({
    liquidEmergencySavings: 6000,
    averageMonthlyEssentialExpenses: 2000,
  });

  assert.equal(cushion.months, 3);
  assert.equal(cushion.tone, "good");
  assert.equal(cushion.ratio, 0.5);
});

test("cushion is unavailable rather than infinite without essential data", () => {
  const cushion = computeCushion({
    liquidEmergencySavings: 6000,
    averageMonthlyEssentialExpenses: null,
  });

  assert.equal(cushion.months, null);
  assert.equal(cushion.ratio, null);
});

test("cushion ratio clamps at the target so a full bar never overflows", () => {
  const cushion = computeCushion({
    liquidEmergencySavings: 24000,
    averageMonthlyEssentialExpenses: 2000,
  });

  assert.equal(cushion.months, 12);
  assert.equal(cushion.ratio, 1);
  assert.equal(cushion.tone, "strong");
});

test("cushion tone boundaries are inclusive at 1, 3 and 6 months", () => {
  assert.equal(resolveCushionTone(0.99), "critical");
  assert.equal(resolveCushionTone(1), "building");
  assert.equal(resolveCushionTone(2.99), "building");
  assert.equal(resolveCushionTone(3), "good");
  assert.equal(resolveCushionTone(5.99), "good");
  assert.equal(resolveCushionTone(6), "strong");
});
