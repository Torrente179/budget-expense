"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/navigation";
import { NavigationPendingIndicator } from "./navigation-pending-indicator";

/**
 * Mobile bottom tab bar: floating liquid-glass capsule.
 * Heavy blur + saturate lets background color “refract” through
 * (light-through-water / iOS material). The capture FAB sits above it.
 */
export function TabBar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("Main navigation", "Navegación principal")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto grid h-14 w-full max-w-md grid-cols-5",
          "rounded-full",
          // Fallback when backdrop-filter isn’t available
          "border border-border/60 bg-background/92 shadow-3",
          // Liquid glass: translucent fill, deep blur, boosted saturate
          "supports-backdrop-filter:border-white/55 supports-backdrop-filter:bg-white/40",
          "supports-backdrop-filter:shadow-[0_10px_40px_-12px_rgba(15,23,35,0.32),inset_0_1px_0_0_rgba(255,255,255,0.75),inset_0_-0.5px_0_0_rgba(255,255,255,0.2)]",
          "supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-[1.85]",
          "dark:supports-backdrop-filter:border-white/12 dark:supports-backdrop-filter:bg-white/[0.08]",
          "dark:supports-backdrop-filter:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.14)]"
        )}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-full transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", active && "stroke-[2.25]")}
              />
              <span
                className={cn(
                  "text-[0.625rem] leading-none",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {t(item.label.en, item.label.es)}
              </span>
              <NavigationPendingIndicator />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
