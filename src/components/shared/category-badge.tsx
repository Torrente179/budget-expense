import { cn } from "@/lib/utils";
import {
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Plane,
  Repeat,
  ShoppingCart,
  MoreHorizontal,
  Receipt,
  TrendingUp,
  Church,
  Landmark,
  Briefcase,
  HeartHandshake,
  Sparkles,
  HandHeart,
  Banknote,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  zap: Zap,
  film: Film,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  plane: Plane,
  repeat: Repeat,
  "shopping-cart": ShoppingCart,
  "more-horizontal": MoreHorizontal,
  receipt: Receipt,
  "trending-up": TrendingUp,
  church: Church,
  landmark: Landmark,
  briefcase: Briefcase,
  "heart-handshake": HeartHandshake,
  sparkles: Sparkles,
  "hand-heart": HandHeart,
  banknote: Banknote,
};

/** Elevated surface for category menus nested inside sheets/dialogs. */
export const CATEGORY_SELECT_CONTENT_CLASS =
  "border border-border bg-card shadow-3 ring-1 ring-foreground/8";

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
  const Icon = iconMap[icon] || MoreHorizontal;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-1",
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
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  const Icon = iconMap[icon] || MoreHorizontal;
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl border shadow-1",
        className
      )}
      style={{ backgroundColor: `${color}15`, borderColor: `${color}24` }}
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
