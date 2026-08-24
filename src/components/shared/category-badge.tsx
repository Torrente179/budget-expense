import { cn } from "@/lib/utils";
import {
  CATEGORY_GLYPHS,
  CATEGORY_GLYPHS_BY_NAME,
  type CategoryGlyphPaths,
} from "@/components/shared/category-glyphs";
import {
  UtensilsCrossed,
  CarFront,
  Home,
  Zap,
  Clapperboard,
  ShoppingBag,
  Stethoscope,
  GraduationCap,
  PlaneTakeoff,
  Repeat,
  MonitorPlay,
  ShoppingCart,
  CircleEllipsis,
  Receipt,
  TrendingUp,
  Church,
  Landmark,
  Briefcase,
  HeartHandshake,
  Sparkles,
  HandHeart,
  Banknote,
  CircleDollarSign,
  Wallet,
  Scissors,
  ShieldCheck,
  Coins,
  PiggyBank,
  ChartLine,
  Dumbbell,
  Wifi,
  Fuel,
  PawPrint,
  Gift,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

/**
 * Category pictograms.
 *
 * Up draws these as single-weight line art — a cart, crossed cutlery, a pair of
 * scissors — so the glyph reads instantly at 18px without any fill. Choices
 * favour the most literal object for the category over an abstract symbol.
 *
 * Legacy keys are kept pointing at their replacements so rows already stored in
 * the database keep resolving; nothing here may be deleted, only re-aimed.
 */
const iconMap: Record<string, LucideIcon> = {
  // Spending
  utensils: UtensilsCrossed,
  "utensils-crossed": UtensilsCrossed,
  car: CarFront,
  "car-front": CarFront,
  fuel: Fuel,
  home: Home,
  house: Home,
  zap: Zap,
  wifi: Wifi,
  film: Clapperboard,
  clapperboard: Clapperboard,
  "monitor-play": MonitorPlay,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  "heart-pulse": Stethoscope,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  plane: PlaneTakeoff,
  "plane-takeoff": PlaneTakeoff,
  repeat: Repeat,
  scissors: Scissors,
  "paw-print": PawPrint,
  gift: Gift,
  "shield-check": ShieldCheck,
  receipt: Receipt,
  "credit-card": CreditCard,

  // Money in / balances
  "trending-up": TrendingUp,
  wallet: Wallet,
  banknote: Banknote,
  coins: Coins,
  "piggy-bank": PiggyBank,
  "chart-line": ChartLine,
  "circle-dollar-sign": CircleDollarSign,
  landmark: Landmark,
  briefcase: Briefcase,

  // Giving
  church: Church,
  "hand-heart": HandHeart,
  "heart-handshake": HeartHandshake,
  sparkles: Sparkles,

  // Fallbacks
  "more-horizontal": CircleEllipsis,
  "circle-ellipsis": CircleEllipsis,
};

/**
 * Name → icon, for categories whose stored `icon` is empty or unknown. Matched
 * case-insensitively against both the English and Spanish name, so a row typed
 * as "Supermercado" still gets a cart.
 */
const iconByName: Record<string, LucideIcon> = {
  "food & dining": UtensilsCrossed,
  "alimentación y restaurantes": UtensilsCrossed,
  restaurants: UtensilsCrossed,
  groceries: ShoppingCart,
  supermercado: ShoppingCart,
  transportation: CarFront,
  transporte: CarFront,
  housing: Home,
  vivienda: Home,
  utilities: Zap,
  servicios: Zap,
  entertainment: Clapperboard,
  entretenimiento: Clapperboard,
  shopping: ShoppingBag,
  compras: ShoppingBag,
  healthcare: Stethoscope,
  salud: Stethoscope,
  education: GraduationCap,
  educación: GraduationCap,
  travel: PlaneTakeoff,
  viajes: PlaneTakeoff,
  subscriptions: MonitorPlay,
  suscripciones: MonitorPlay,
  loan: Banknote,
  préstamo: Banknote,
  salary: Wallet,
  nómina: Wallet,
  "other income": TrendingUp,
  "otros ingresos": TrendingUp,
  taxes: Landmark,
  impuestos: Landmark,
  "professional services": Briefcase,
  "servicios profesionales": Briefcase,
  donations: HandHeart,
  donaciones: HandHeart,
  "personal care": Scissors,
  "cuidado personal": Scissors,
  tithe: Church,
  diezmo: Church,
  insurance: ShieldCheck,
  seguros: ShieldCheck,
  cash: Coins,
  efectivo: Coins,
  savings: PiggyBank,
  ahorro: PiggyBank,
  investments: ChartLine,
  inversiones: ChartLine,
};


/** The hand-drawn family, stroked to match lucide at the same weight. */
function DrawnGlyph({
  paths,
  className,
}: {
  paths: CategoryGlyphPaths;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths.d} />
        {paths.d2 && <path d={paths.d2} />}
      </g>
    </svg>
  );
}

/**
 * Bare category glyph — no badge chrome. For callers that draw their own
 * container (Home Presupuesto cards) and only need the right pictogram.
 */
export function CategoryGlyph({
  icon,
  name,
  className,
}: {
  icon: string;
  /** Used when `icon` is empty or unknown. */
  name?: string;
  className?: string;
}) {
  const key = name?.trim().toLowerCase();
  const drawn =
    (icon ? CATEGORY_GLYPHS[icon] : undefined) ??
    (key ? CATEGORY_GLYPHS_BY_NAME[key] : undefined);
  if (drawn) return <DrawnGlyph paths={drawn} className={className} />;

  const Icon =
    (icon ? iconMap[icon] : undefined) ??
    (key ? iconByName[key] : undefined) ??
    CircleEllipsis;
  return <Icon className={className} strokeWidth={1.5} />;
}

/** Elevated, high-contrast surface for category menus nested inside sheets. */
export const CATEGORY_SELECT_CONTENT_CLASS =
  "border-2 border-foreground/20 bg-card shadow-none ring-1 ring-foreground/10";

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color: string;
  className?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({
  name,
  icon,
  color,
  className,
  size = "sm",
}: CategoryBadgeProps) {
  const Icon =
    (icon ? iconMap[icon] : undefined) ??
    (name ? iconByName[name.trim().toLowerCase()] : undefined) ??
    CircleEllipsis;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}24`,
      }}
    >
      <Icon className={iconSize} />
      {name}
    </span>
  );
}

export function CategoryIcon({
  icon,
  color,
  name,
  className,
}: {
  icon: string;
  color: string;
  /** Used when `icon` is empty or unknown. */
  name?: string;
  className?: string;
}) {
  const Icon =
    (icon ? iconMap[icon] : undefined) ??
    (name ? iconByName[name.trim().toLowerCase()] : undefined) ??
    CircleEllipsis;
  /* Hybrid: the chip is neutral, the glyph keeps its category colour.
     Drops the tinted-square look without losing the colour cue. */
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted",
        className
      )}
    >
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
  );
}

/** Compact icon + label used inside SelectItem / SelectValue. */
export function CategoryOption({
  name,
  icon,
  color,
  className,
}: {
  name: string;
  icon: string;
  color: string;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <CategoryIcon
        icon={icon}
        color={color}
        className="h-5 w-5 shrink-0 rounded-lg"
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
