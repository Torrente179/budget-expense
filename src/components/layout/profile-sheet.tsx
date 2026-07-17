"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";
import { useReviewCount } from "@/hooks/use-review-queue";
import { SECONDARY_NAV } from "@/lib/navigation";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Mobile account/secondary-nav surface: avatar button in screen headers
 * opens a bottom sheet with secondary destinations, preference switches,
 * and logout. Replaces the old hamburger drawer.
 */
export function ProfileSheet({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const reviewCount = useReviewCount();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setEmail(data.user?.email ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("Account and more", "Cuenta y más")}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className
        )}
      >
        <CircleUserRound className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0">
          <SheetHeader className="pb-2">
            <SheetTitle>{t("Account", "Cuenta")}</SheetTitle>
            {email && (
              <p className="truncate text-caption text-muted-foreground">
                {email}
              </p>
            )}
          </SheetHeader>
          <nav className="flex flex-col px-2 pb-2">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
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
          </nav>
          <div className="space-y-4 border-t border-border px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="space-y-2">
              <p className="text-caption font-medium text-muted-foreground">
                {t("Language", "Idioma")}
              </p>
              <LanguageSwitch fullWidth />
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
