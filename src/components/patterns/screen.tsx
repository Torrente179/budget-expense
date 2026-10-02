"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProfileSheet } from "@/components/layout/profile-sheet";
import { CommandMenu } from "@/components/layout/command-menu";
import { CaptureButton } from "@/components/capture/capture-button";
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
  /** Replaces the mobile profile trigger. Ignored when backHref is set. */
  leading?: ReactNode;
  /** Trailing header actions (icon buttons, pickers). */
  actions?: ReactNode;
  /** Optional second header row (segmented controls, filters). Sticks with the header. */
  subheader?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Layout rhythm only — every mode shares the one dark ground.
   * `chrome-sheet` joins a hero to the list below it with no gap.
   * `dark-canvas` stacks card groups with a small gap.
   * `plain` is the roomier scaffold for secondary routes and forms.
   */
  mode?: ScreenMode;
  /** Constrains the screen without changing route-level shell breakpoints. */
  width?: ScreenWidth;
  /** Hide search/preference actions in immersive flows. */
  showUtilities?: boolean;
  /** Hide the add-movement button (flows that are themselves a capture). */
  showCapture?: boolean;
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
      className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-[var(--motion-standard)] hover:bg-accent hover:text-foreground"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

/**
 * App-screen scaffold: one header row on the page ground, history-first back
 * navigation, consistent gutters, and an optional subheader.
 *
 * The header reads left to right as: back (pushed screens), title, the
 * screen's own actions, search, the profile trigger, and the accent
 * add-movement button — always last, so it sits in the same corner on every
 * screen. From `lg` up, language and currency sit in the header and the
 * profile trigger gives way to them; below that they live in the profile
 * sheet, so the title keeps its room on phones and tablets.
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
  showCapture = true,
}: ScreenProps) {
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
          "sticky top-0 z-30 -mx-4 bg-background/92 px-4 pt-[env(safe-area-inset-top)] text-foreground backdrop-blur-xl sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8",
          mode === "plain" && "mb-3"
        )}
      >
        <div className="flex min-h-16 items-center gap-2.5 py-2.5">
          {backHref ? <ScreenBackButton fallbackHref={backHref} /> : null}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="label-caps">{eyebrow}</p>}
            <h1
              className={cn(
                "truncate",
                backHref
                  ? "text-title font-bold"
                  : "text-screen font-extrabold"
              )}
            >
              {title}
            </h1>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
          {showUtilities && (
            <>
              <CommandMenu />
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <LanguageSwitch />
                <CurrencyQuickSwitch />
              </div>
            </>
          )}
          {backHref
            ? null
            : (leading ?? <ProfileSheet className="lg:hidden" />)}
          {showCapture && <CaptureButton />}
        </div>
        {subheader && <div className="pb-3">{subheader}</div>}
      </header>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mode === "plain" && "gap-4",
          mode === "chrome-sheet" && "gap-0",
          mode === "dark-canvas" && "gap-3 pb-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}
