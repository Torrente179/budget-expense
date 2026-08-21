"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/navigation";
import { NavigationPendingIndicator } from "./navigation-pending-indicator";

/** Flat, opaque mobile navigation adapted from Up's ink chrome. */
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto grid h-[60px] w-full max-w-md grid-cols-5 rounded-full",
          "border border-white/10 bg-ink"
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
                  : "text-white/52 hover:text-white"
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
