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
};

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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
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
        "flex h-8 w-8 items-center justify-center rounded-lg",
        className
      )}
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
  );
}
