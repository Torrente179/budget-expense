import type { EnvelopeRow } from "@/components/budget/envelope-list-card";
import type {
  HomeFeedDay,
  HomeUpcomingPayment,
} from "@/components/home/home-activity-sheet";

/**
 * Sample data for the screenshots on the public landing page.
 *
 * Deterministic and plausible — a household with a payroll, a shared dinner,
 * a saver transfer and one tracker already over its limit, so the screens show
 * the app doing something rather than sitting empty. **Nobody's real ledger**,
 * and deliberately no round marketing numbers either.
 *
 * Category colours are the app's own defaults so a glyph on the landing page
 * is the same colour it will be once the visitor signs in.
 */

const GROCERIES = { icon: "shopping-cart", color: "#3DDC97" };
const DINING = { icon: "utensils", color: "#FFE14D" };
const TRANSPORT = { icon: "car-front", color: "#28C4D8" };
const SUBSCRIPTIONS = { icon: "monitor-play", color: "#B565D8" };
const HEALTH = { icon: "stethoscope", color: "#FF7A64" };
const HOUSING = { icon: "house", color: "#F5A623" };

export const DEMO_CURRENCY = "EUR";

export const demoAvailable = 2847.3;
export const demoMoneyIn = 2410;
export const demoMoneyOut = 1798.6;
export const demoDailyGuide = 158.2;
export const demoNetWorth = 48120.65;
export const demoNetWorthChange = 1240;
export const demoBudgetRemaining = 612.4;

export const demoFeedDays: HomeFeedDay[] = [
  {
    date: "2026-08-13",
    label: "Thu, 13 August",
    movements: [
      {
        id: "m1",
        kind: "expense",
        title: "Mercadona",
        subtitle: "18:04 · Groceries",
        amount: 41.2,
        currency: "EUR",
        category: GROCERIES,
        needsReview: false,
        alt: false,
      },
      {
        id: "m2",
        kind: "expense",
        title: "Bar Peñíscola",
        subtitle: "14:12 · Dining",
        amount: 12.5,
        currency: "EUR",
        category: DINING,
        needsReview: false,
        alt: true,
      },
      {
        id: "m3",
        kind: "income",
        title: "Ana R.",
        subtitle: "11:30 · Split for dinner",
        amount: 18.4,
        currency: "EUR",
        category: null,
        needsReview: false,
        alt: false,
      },
    ],
  },
  {
    date: "2026-08-12",
    label: "Wed, 12 August",
    movements: [
      {
        id: "m4",
        kind: "expense",
        title: "Spotify",
        subtitle: "09:00 · Subscriptions",
        amount: 11.99,
        currency: "EUR",
        category: SUBSCRIPTIONS,
        needsReview: false,
        alt: true,
      },
      {
        id: "m5",
        kind: "expense",
        title: "Transfer to Japón 2027",
        subtitle: "08:15 · Savings",
        amount: 120,
        currency: "EUR",
        category: null,
        needsReview: false,
        alt: false,
      },
      {
        id: "m6",
        kind: "expense",
        title: "Renfe",
        subtitle: "07:41 · Transport",
        amount: 9.6,
        currency: "EUR",
        category: TRANSPORT,
        needsReview: false,
        alt: true,
      },
    ],
  },
  {
    date: "2026-08-11",
    label: "Tue, 11 August",
    movements: [
      {
        id: "m7",
        kind: "income",
        title: "Nómina",
        subtitle: "Payroll",
        amount: 2410,
        currency: "EUR",
        category: null,
        needsReview: false,
        alt: false,
      },
      {
        id: "m8",
        kind: "expense",
        title: "Amazon",
        subtitle: "19:22 · amazon.es",
        amount: 27.99,
        currency: "EUR",
        category: null,
        needsReview: true,
        alt: true,
      },
    ],
  },
];

export const demoUpcoming: HomeUpcomingPayment[] = [
  {
    id: "u1",
    title: "Alquiler",
    dueLabel: "Due 1 September",
    amount: 890,
    currency: "EUR",
    category: HOUSING,
  },
  {
    id: "u2",
    title: "Netflix",
    dueLabel: "Due 18 August",
    amount: 13.99,
    currency: "EUR",
    category: SUBSCRIPTIONS,
  },
];

/**
 * One tracker is deliberately over its limit. Showing only healthy budgets
 * would misrepresent what the screen looks like in the month you overspend,
 * which is the month it matters.
 */
export const demoTrackers: EnvelopeRow[] = [
  {
    id: "t1",
    name: "Groceries",
    kind: "spending_limit",
    target: 330,
    progressAmount: 206,
    ratio: 0.624,
    icon: GROCERIES.icon,
    color: GROCERIES.color,
  },
  {
    id: "t2",
    name: "Dining",
    kind: "spending_limit",
    target: 180,
    progressAmount: 218,
    ratio: 1.211,
    icon: DINING.icon,
    color: DINING.color,
  },
  {
    id: "t3",
    name: "Transport",
    kind: "spending_limit",
    target: 100,
    progressAmount: 44,
    ratio: 0.44,
    icon: TRANSPORT.icon,
    color: TRANSPORT.color,
  },
  {
    id: "t4",
    name: "Subscriptions",
    kind: "spending_limit",
    target: 55,
    progressAmount: 43,
    ratio: 0.782,
    icon: SUBSCRIPTIONS.icon,
    color: SUBSCRIPTIONS.color,
  },
  {
    id: "t5",
    name: "Health",
    kind: "spending_limit",
    target: 120,
    progressAmount: 30,
    ratio: 0.25,
    icon: HEALTH.icon,
    color: HEALTH.color,
  },
  {
    id: "t6",
    name: "Casa",
    kind: "spending_limit",
    target: 720,
    progressAmount: 510,
    ratio: 0.708,
    icon: HOUSING.icon,
    color: HOUSING.color,
  },
];

/** The five Patrimonio buckets, in the accents `lib/palette.ts` assigns them. */
export const demoWealthBuckets = [
  { key: "accounts", amount: 4210.55 },
  { key: "savings", amount: 12400 },
  { key: "investments", amount: 33900.1 },
  { key: "lent", amount: 600 },
  { key: "debts", amount: -2990 },
] as const;

/** Twelve months of spend, current month last. Heights are a share of the max. */
export const demoSpendMonths = [
  { key: "S", ratio: 0.48 },
  { key: "O", ratio: 0.67 },
  { key: "N", ratio: 0.6 },
  { key: "D", ratio: 0.96 },
  { key: "J", ratio: 0.55 },
  { key: "F", ratio: 0.51 },
  { key: "M", ratio: 0.72 },
  { key: "A", ratio: 0.63 },
  { key: "M", ratio: 0.77 },
  { key: "J", ratio: 0.65 },
  { key: "J", ratio: 0.83 },
  { key: "A", ratio: 1 },
];

export const demoSpendCategories = [
  { name: "Casa", amount: 890, ratio: 1, color: HOUSING.color },
  { name: "Good Life", amount: 412, ratio: 0.46, color: DINING.color },
  { name: "Groceries", amount: 276, ratio: 0.31, color: GROCERIES.color },
  { name: "Transport", amount: 144, ratio: 0.16, color: TRANSPORT.color },
  { name: "Giving", amount: 241, ratio: 0.27, color: SUBSCRIPTIONS.color },
];
