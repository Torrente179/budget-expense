"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useRouter } from "next/navigation";
import { useLocale } from "@/providers/locale-provider";

export function Sidebar() {
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
    <aside className="hidden border-r border-sidebar-border bg-sidebar md:flex md:w-[268px] md:flex-col">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/dashboard" className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-secondary">
            <span className="text-sm font-semibold tracking-[0.16em] text-foreground">
              BE
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[0.7rem] uppercase tracking-[0.26em] text-muted-foreground">
              {t("Stewardship", "Mayordomía")}
            </span>
            <span className="block text-lg font-semibold leading-none tracking-tight">
              Budget & Expense
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 px-3 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-secondary text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("Log out", "Cerrar sesión")}
        </button>
      </div>
    </aside>
  );
}
