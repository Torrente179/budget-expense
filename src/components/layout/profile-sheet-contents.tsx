"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { MENU_NAV } from "@/lib/navigation";
import { LanguagePreferenceRow } from "@/components/shared/language-switch";
import { ThemePreferenceRow } from "@/components/shared/theme-switch";
import { CurrencyQuickSwitch } from "@/components/shared/currency-quick-switch";
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
  const { data: bootstrap } = useAppBootstrap();
  const email = bootstrap?.identity.email ?? null;

  async function handleLogout() {
    await supabase.auth.signOut();
    onOpenChange(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 bg-popover">
        <SheetHeader className="mt-2 bg-background px-5 pb-4 pt-5 text-foreground">
          <SheetTitle className="text-foreground">{t("Account", "Cuenta")}</SheetTitle>
          {email && (
            <p className="truncate text-caption text-muted-foreground">
              {email}
            </p>
          )}
        </SheetHeader>
        <nav className="flex flex-col divide-y divide-border/70 pb-1">
          {MENU_NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="flex min-h-12 items-center gap-3 px-5 text-body font-medium text-foreground transition-colors hover:bg-accent"
            >
              <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
              {t(item.label.en, item.label.es)}
            </Link>
          ))}
          <LanguagePreferenceRow />
          <ThemePreferenceRow />
        </nav>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <CurrencyQuickSwitch />
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto flex min-h-11 items-center gap-2 px-3 text-body font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("Log out", "Cerrar sesión")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
