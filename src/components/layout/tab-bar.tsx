"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/navigation";

/**
 * Mobile bottom tab bar: the five core sections, native-app style.
 * The quick-add FAB floats above it, bottom-right.
 */
export function TabBar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("Main navigation", "Navegación principal")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
