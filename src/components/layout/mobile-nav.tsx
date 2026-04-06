"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowUpDown,
  PiggyBank,
  Settings,
  LogOut,
  BookOpenText,
  CandlestickChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";

export function MobileNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const navItems = [
    { href: "/dashboard", label: t("Dashboard", "Panel"), icon: LayoutDashboard },
    { href: "/movimientos", label: t("Movements", "Movimientos"), icon: ArrowUpDown },
    { href: "/budgets", label: t("Budgets", "Presupuestos"), icon: PiggyBank },
    {
      href: "/investments",
      label: t("Investments", "Inversiones"),
      icon: CandlestickChart,
    },
    { href: "/wisdom", label: t("Wisdom", "Sabiduría"), icon: BookOpenText },
    { href: "/settings", label: t("Settings", "Ajustes"), icon: Settings },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-secondary">
            <span className="text-xs font-semibold tracking-[0.18em] text-foreground">
              BE
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
              {t("Stewardship", "Mayordomía")}
            </span>
            <span className="block text-lg font-semibold leading-none tracking-tight">
              Budget & Expense
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-secondary text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("Log out", "Cerrar sesión")}
        </button>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const navItems = [
    { href: "/dashboard", label: t("Dashboard", "Panel"), icon: LayoutDashboard },
    { href: "/movimientos", label: t("Movements", "Movimientos"), icon: ArrowUpDown },
    { href: "/budgets", label: t("Budgets", "Presupuestos"), icon: PiggyBank },
    {
      href: "/investments",
      label: t("Investments", "Inversiones"),
      icon: CandlestickChart,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.75rem] items-center gap-1 border-t border-border bg-background/92 px-2 backdrop-blur-2xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[9px] font-medium leading-none tracking-[-0.01em] transition-all duration-150",
              isActive
                ? "bg-secondary text-foreground ring-1 ring-border"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-[1.05rem] w-[1.05rem]" />
            <span className="w-full truncate text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
