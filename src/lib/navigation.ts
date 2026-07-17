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
    label: { en: "Wealth", es: "Patrimonio" },
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

export function isNavItemActive(item: NavItem, pathname: string) {
  return item.match.test(pathname);
}
