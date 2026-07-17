"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileSheet } from "@/components/layout/profile-sheet";
import { LanguageSwitch } from "@/components/shared/language-switch";
import type { ReactNode } from "react";

interface ScreenProps {
  /** Screen title shown in the sticky header. */
  title: ReactNode;
  /** Small eyebrow line above the title (label-caps). */
  eyebrow?: ReactNode;
  /** When set, renders a back chevron instead of the leading slot (pushed screens). */
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

/**
 * App-screen scaffold: sticky translucent header with title/back/actions,
 * consistent gutters, and room for a subheader row. Every routed screen
 * renders inside this so mobile feels like pushed native screens.
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
      <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border/60 bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
        <div className="flex min-h-14 items-center gap-3 py-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            (leading ?? (
              <div className="flex shrink-0 items-center gap-1 md:hidden">
                <ProfileSheet className="-ml-2" />
              </div>
            ))
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="label-caps">{eyebrow}</p>}
            <h1 className="truncate text-title font-semibold text-foreground">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!backHref && (
              <LanguageSwitch compact className="md:hidden" />
            )}
            {actions}
          </div>
        </div>
        {subheader && <div className="pb-3">{subheader}</div>}
      </header>
      <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}
