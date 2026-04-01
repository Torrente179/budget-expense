"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNavContent } from "./mobile-nav";

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/72 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <MobileNavContent />
            </SheetContent>
          </Sheet>
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary">
            <span className="text-xs font-semibold tracking-[0.18em] text-primary-foreground">
              BE
            </span>
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground">
            Clarity for the month. Calm for the decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CurrencyQuickSwitch />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
