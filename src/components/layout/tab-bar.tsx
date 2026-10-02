"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/navigation";
import { NavigationPendingIndicator } from "./navigation-pending-indicator";

/** Floating capsule navigation: a raised, slightly translucent surface. */
export function TabBar({
  pathnameOverride,
  staticPreview = false,
}: {
  pathnameOverride?: string;
  /** Keep production navigation visible without prefetching or leaving a fixture. */
  staticPreview?: boolean;
} = {}) {
  const currentPathname = usePathname();
  const pathname = pathnameOverride ?? currentPathname;
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("Main navigation", "Navegación principal")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto grid h-16 w-full max-w-md grid-cols-5 rounded-full px-1.5",
          "border border-border bg-tabbar/85 shadow-3 backdrop-blur-xl backdrop-saturate-150"
        )}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch={staticPreview ? false : undefined}
              onClick={
                staticPreview
                  ? (event) => event.preventDefault()
                  : undefined
              }
              aria-disabled={staticPreview || undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-full transition-colors duration-[var(--motion-standard)]",
                active
                  ? "text-coral"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-[1.375rem] w-[1.375rem]", active && "stroke-[2.25]")}
              />
              <span
                className={cn(
                  "text-nav tracking-tight",
                  active ? "font-extrabold" : "font-semibold"
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
