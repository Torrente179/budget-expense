"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";
import { useReviewCount } from "@/hooks/use-review-queue";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { SECONDARY_NAV } from "@/lib/navigation";
import { LanguagePreferenceRow } from "@/components/shared/language-switch";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ProfileSheetContents({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const { data: bootstrap } = useAppBootstrap();
  const reviewCount = useReviewCount();
  const email = bootstrap?.identity.email ?? null;

  async function handleLogout() {
    await supabase.auth.signOut();
    onOpenChange(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0">
        <SheetHeader className="pb-2">
          <SheetTitle>{t("Account", "Cuenta")}</SheetTitle>
          {email && (
            <p className="truncate text-caption text-muted-foreground">
              {email}
            </p>
          )}
        </SheetHeader>
        <nav className="flex flex-col px-2 pb-1">
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-body font-medium text-foreground transition-colors hover:bg-accent"
            >
              <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
              {t(item.label.en, item.label.es)}
              {item.badge === "review" && reviewCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-subtle px-1.5 font-mono text-label tabular-nums text-warning ring-1 ring-warning/25">
                  {reviewCount}
                </span>
              )}
            </Link>
          ))}
          <LanguagePreferenceRow />
        </nav>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <CurrencyQuickSwitch />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border bg-secondary/80"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">
              {t("Toggle theme", "Cambiar tema")}
            </span>
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-body font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("Log out", "Cerrar sesión")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
