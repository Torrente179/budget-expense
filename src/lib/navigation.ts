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

/**
 * Review is surfaced where it is needed: a prompt on Home whenever something
 * is waiting. It is not a standing menu row.
 */
export const REVIEW_NAV: NavItem = {
  key: "review",
  href: "/review",
  label: { en: "Review", es: "Revisión" },
  icon: ClipboardCheck,
  match: /^\/review/,
  badge: "review",
};

/**
 * Import is an action, not a section: a button at the foot of the desktop
 * sidebar and an action in the Movements header on a phone.
 */
export const IMPORT_NAV: NavItem = {
  key: "import",
  href: "/import",
  label: { en: "Import", es: "Importar" },
  icon: FileUp,
  match: /^\/import/,
};

/** The "More" group: desktop sidebar and the phone's profile sheet. */
export const MENU_NAV: NavItem[] = [
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

/** Every secondary destination, for surfaces that list them all (search). */
export const SECONDARY_NAV: NavItem[] = [REVIEW_NAV, IMPORT_NAV, ...MENU_NAV];

export function isNavItemActive(item: NavItem, pathname: string) {
  return item.match.test(pathname);
}
