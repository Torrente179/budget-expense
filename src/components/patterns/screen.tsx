"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProfileSheet } from "@/components/layout/profile-sheet";
import type { ReactNode } from "react";

interface ScreenProps {
  /** Screen title shown in the sticky header. */
  title: ReactNode;
  /** Small eyebrow line above the title (label-caps). */
  eyebrow?: ReactNode;
  /**
   * When set, shows a back chevron. Uses previous history when available;
   * otherwise navigates to this safe fallback (deep links / refresh).
   */
  backHref?: string;
  /** Leading slot on mobile (e.g. profile avatar). Ignored when backHref is set. */
  leading?: ReactNode;
  /** Trailing header actions (icon buttons, pickers). */
  actions?: ReactNode;
  /** Optional second header row (segmented controls, filters). Sticks with the header. */
  subheader?: ReactNode;
  children: ReactNode;
  className?: string;
}

function ScreenBackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white md:text-muted-foreground md:hover:bg-accent md:hover:text-foreground"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

/**
 * App-screen scaffold: sticky translucent header with title/back/actions,
 * consistent gutters, and room for a subheader row. Every routed screen
 * renders inside this so mobile feels like pushed native screens.
 *
 * Language lives in Account / Settings — never in this chrome — so month
 * pickers and actions keep the full header width.
 */
export function Screen({
  title,
  eyebrow,
  backHref,
  leading,
  actions,
  subheader,
  children,
  className,
}: ScreenProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {/* On mobile this continues the dark chrome band started by NavRail, so
          the rail, the title row and the hero read as one ink surface with the
          white sheet below — Up's two-layer stack. Desktop keeps the light
          header, since desktop keeps the sidebar. */}
      <header className="up-chrome sticky top-0 z-30 -mx-4 mb-4 px-4 sm:-mx-5 sm:px-5 md:border-b md:border-border/60 md:bg-background/85 md:text-foreground md:backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex min-h-14 items-center gap-3 py-2">
          {backHref ? (
            <ScreenBackButton fallbackHref={backHref || "/home"} />
          ) : (
            (leading ?? <ProfileSheet className="-ml-2 md:hidden" />)
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="label-caps text-white/55 md:text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate text-title font-semibold text-white md:text-foreground">
              {title}
            </h1>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          )}
        </div>
        {subheader && <div className="pb-3">{subheader}</div>}
      </header>
      <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}
