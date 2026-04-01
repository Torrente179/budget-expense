"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { useLocale } from "@/providers/locale-provider";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNavContent } from "./mobile-nav";
import { MobileCommandPalette } from "./mobile-command-palette";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-2xl sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl border border-border bg-secondary/80"
                />
              }
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">{t("Open menu", "Abrir menú")}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <SheetTitle className="sr-only">
                {t("Navigation menu", "Menú de navegación")}
              </SheetTitle>
              <MobileNavContent />
            </SheetContent>
          </Sheet>
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border bg-secondary">
            <span className="text-xs font-semibold tracking-[0.18em] text-foreground">
              BE
            </span>
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("Monthly ledger", "Registro mensual")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MobileCommandPalette />
          <LanguageSwitch compact />
          <CurrencyQuickSwitch />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-2xl border border-border bg-secondary/80"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">
              {t("Toggle theme", "Cambiar tema")}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
