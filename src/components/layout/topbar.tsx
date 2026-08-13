"use client";

import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { CommandMenu } from "./command-menu";

/**
 * Desktop-only top bar: quick navigation and preference switches.
 * Mobile screens render their own headers (see patterns/screen.tsx).
 *
 * No appearance toggle — Up has one appearance, so there is nothing to switch.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/80 px-4 py-3 backdrop-blur-2xl sm:px-5 md:block lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-end gap-2">
        <CommandMenu />
        <LanguageSwitch />
        <CurrencyQuickSwitch />
      </div>
    </header>
  );
}
