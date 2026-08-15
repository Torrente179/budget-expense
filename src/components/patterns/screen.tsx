"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProfileSheet } from "@/components/layout/profile-sheet";
import { CommandMenu } from "@/components/layout/command-menu";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import type { ReactNode } from "react";

export type ScreenMode = "chrome-sheet" | "dark-canvas" | "plain";
export type ScreenWidth = "reading" | "wide" | "full";

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
  /**
   * `chrome-sheet` connects an ink header/hero to a white list sheet.
   * `dark-canvas` keeps goal-card screens on ink throughout.
   * `plain` is the dense neutral scaffold for secondary routes and forms.
   */
  mode?: ScreenMode;
  /** Constrains the screen without changing route-level shell breakpoints. */
  width?: ScreenWidth;
  /** Hide desktop command/preference actions in immersive flows. */
  showUtilities?: boolean;
}

function ScreenBackButton({
  fallbackHref,
  onInk = false,
}: {
  fallbackHref: string;
  onInk?: boolean;
}) {
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
      className={cn(
        "-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--motion-standard)]",
        onInk
          ? "text-white/60 hover:bg-white/8 hover:text-white"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

/**
 * App-screen scaffold: solid route chrome, history-first back navigation,
 * consistent gutters, and an optional subheader. The mode controls whether
 * content joins a white sheet, stays on the ink canvas, or uses the neutral
 * secondary-screen ground. Desktop utilities live here; mobile keeps them in
 * the profile and command surfaces so primary actions retain the full width.
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
  mode = "plain",
  width = "wide",
  showUtilities = true,
}: ScreenProps) {
  const onInk = mode !== "plain";

  return (
    <div
      data-screen-mode={mode}
      className={cn(
        "mx-auto flex min-w-0 w-full flex-col",
        width === "reading" && "max-w-3xl",
        width === "wide" && "max-w-[1480px]",
        mode === "dark-canvas" && "min-h-full",
        className
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-30 -mx-4 border-b px-4 pt-[env(safe-area-inset-top)] sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8",
          onInk
            ? "border-white/8 bg-ink text-white"
            : "border-border bg-background text-foreground",
          mode === "plain" && "mb-3"
        )}
      >
        <div className="flex min-h-14 items-center gap-3 py-2">
          {backHref ? (
            <ScreenBackButton
              fallbackHref={backHref || "/home"}
              onInk={onInk}
            />
          ) : (
            (leading ?? (
              <ProfileSheet
                className={cn(
                  "-ml-2 md:hidden",
                  onInk &&
                    "text-white/60 hover:bg-white/[0.08] hover:text-white"
                )}
              />
            ))
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className={cn("label-caps", onInk && "text-white/45")}>
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                "truncate text-title font-semibold",
                onInk ? "text-white" : "text-foreground"
              )}
            >
              {title}
            </h1>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          )}
          {showUtilities && (
            <div
              className={cn(
                "hidden shrink-0 items-center gap-1.5 md:flex",
                actions && "ml-2 border-l pl-2",
                onInk ? "border-white/10" : "border-border"
              )}
            >
              <CommandMenu onInk={onInk} />
              <LanguageSwitch
                className={
                  onInk
                    ? "border-white/10 bg-white/[0.07] text-white hover:bg-white/10 hover:text-white"
                    : undefined
                }
              />
              <CurrencyQuickSwitch onInk={onInk} />
            </div>
          )}
        </div>
        {subheader && <div className="pb-3">{subheader}</div>}
      </header>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mode === "plain" && "gap-4",
          mode === "chrome-sheet" && "gap-0",
          mode === "dark-canvas" &&
            "-mx-4 gap-3 bg-ink px-4 pb-8 text-white sm:-mx-5 sm:px-5 md:mx-0 md:px-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
