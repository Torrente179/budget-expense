import {
  Home,
  ArrowUpDown,
  PiggyBank,
  Landmark,
  BarChart3,
  FileUp,
  ClipboardCheck,
  BookOpenText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "home"
  | "movements"
  | "budget"
  | "wealth"
  | "insights"
  | "import"
  | "review"
  | "wisdom"
  | "settings";

export interface NavItem {
  key: NavKey;
  href: string;
  label: { en: string; es: string };
  icon: LucideIcon;
  /** Active-state test so sub-routes highlight their section. */
  match: RegExp;
  /** Badge source key, resolved by the consuming surface. */
  badge?: "review";
}

/** The five core sections. Single source of truth for every nav surface. */
export const PRIMARY_NAV: NavItem[] = [
  {
    key: "home",
    href: "/home",
    label: { en: "Home", es: "Inicio" },
    icon: Home,
    match: /^\/home/,
  },
  {
    key: "movements",
    href: "/movements",
    label: { en: "Movements", es: "Movimientos" },
    icon: ArrowUpDown,
    match: /^\/movements/,
  },
  {
    key: "budget",
    href: "/budget",
    label: { en: "Budget", es: "Presupuesto" },
    icon: PiggyBank,
    match: /^\/budget/,
  },
  {
    key: "wealth",
    href: "/wealth",
    label: { en: "Net worth", es: "Patrimonio" },
    icon: Landmark,
    match: /^\/wealth/,
  },
  {
    key: "insights",
    href: "/insights",
    label: { en: "Insights", es: "Análisis" },
    icon: BarChart3,
    match: /^\/insights/,
  },
];

/** Secondary destinations: sidebar footer group, profile sheet, command menu. */
export const SECONDARY_NAV: NavItem[] = [
  {
    key: "review",
    href: "/review",
    label: { en: "Review", es: "Revisión" },
    icon: ClipboardCheck,
    match: /^\/review/,
    badge: "review",
  },
  {
    key: "import",
    href: "/import",
    label: { en: "Import", es: "Importar" },
    icon: FileUp,
    match: /^\/import/,
  },
  {
    key: "wisdom",
    href: "/wisdom",
    label: { en: "Wisdom", es: "Sabiduría" },
    icon: BookOpenText,
    match: /^\/wisdom/,
  },
  {
    key: "settings",
    href: "/settings",
    label: { en: "Settings", es: "Ajustes" },
    icon: Settings,
    match: /^\/settings/,
  },
];

/**
 * Display order for the mobile tab rail.
 *
 * The rail centres the active section and lets its neighbours clip at the
 * screen edges — that clipping is what says "there is more sideways". With
 * Home first in `PRIMARY_NAV` there is never anything to its left, so the
 * affordance only works on one side and the default screen looks like the end
 * of the list. Up solves this the same way: its home surface (Activity) sits
 * in the middle of the rail, not at the start.
 *
 * Same items, same source of truth — only the order differs. The sidebar and
 * command menu keep `PRIMARY_NAV` order.
 */
const RAIL_ORDER: NavKey[] = [
  "wealth",
  "insights",
  "home",
  "movements",
  "budget",
];

export const RAIL_NAV: NavItem[] = RAIL_ORDER.map(
  (key) => PRIMARY_NAV.find((item) => item.key === key)!
);

export function isNavItemActive(item: NavItem, pathname: string) {
  return item.match.test(pathname);
}
