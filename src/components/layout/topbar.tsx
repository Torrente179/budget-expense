"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { useLocale } from "@/providers/locale-provider";
import { CommandMenu } from "./command-menu";

/**
 * Desktop-only top bar: quick navigation and preference switches.
 * Mobile screens render their own headers (see patterns/screen.tsx).
 */
export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/80 px-4 py-3 backdrop-blur-2xl sm:px-5 md:block lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-end gap-2">
        <CommandMenu />
        <LanguageSwitch compact />
        <CurrencyQuickSwitch />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-border bg-secondary/80"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("Toggle theme", "Cambiar tema")}</span>
        </Button>
      </div>
    </header>
  );
}
