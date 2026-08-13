"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { RAIL_NAV, isNavItemActive } from "@/lib/navigation";

/**
 * Up's section navigation: a horizontally-scrolling rail pinned to the top of
 * the screen, on the dark chrome band.
 *
 * The active section is centred and its neighbours are **clipped by the screen
 * edges** — that clipping is the affordance, the thing that says "there is more
 * sideways". Up rejected a bottom tab bar for exactly this; their design blog
 * puts it as tab-navs not lending themselves to being flexible.
 *
 * Mobile only. Desktop keeps the sidebar.
 */
export function NavRail() {
  const pathname = usePathname();
  const { t } = useLocale();
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const active = activeRef.current;
    if (!rail || !active) return;
    // Centre without smooth scrolling: the rail should already be centred on
    // first paint, not seen sliding into place.
    rail.scrollLeft =
      active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2;
  }, [pathname]);

  return (
    <nav
      aria-label={t("Main navigation", "Navegación principal")}
      className="up-chrome sticky top-0 z-40 pt-[env(safe-area-inset-top)] md:hidden"
    >
      <div
        ref={railRef}
        className="flex gap-7 overflow-x-auto px-[50%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RAIL_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              ref={active ? activeRef : undefined}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap py-3 text-heading transition-colors",
                active ? "font-bold text-white" : "font-semibold text-white/45"
              )}
            >
              {t(item.label.en, item.label.es)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
