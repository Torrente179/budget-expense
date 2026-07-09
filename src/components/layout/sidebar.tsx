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
  CalendarDays,
  BarChart3,
  FileUp,
  ClipboardCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale } from "@/providers/locale-provider";
import { useReviewCount } from "@/hooks/use-review-queue";
import { SiteBrand } from "./site-brand";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const reviewCount = useReviewCount();
  const navItems = [
    { href: "/dashboard", label: t("Dashboard", "Panel"), icon: LayoutDashboard },
    { href: "/movimientos", label: t("Movements", "Movimientos"), icon: ArrowUpDown },
    { href: "/budgets", label: t("Budgets", "Presupuestos"), icon: PiggyBank },
    { href: "/calendar", label: t("Calendar", "Calendario"), icon: CalendarDays },
    { href: "/analytics", label: t("Analytics", "Analítica"), icon: BarChart3 },
    {
      href: "/investments",
      label: t("Investments", "Inversiones"),
      icon: CandlestickChart,
    },
    { href: "/import", label: t("Import", "Importar"), icon: FileUp },
    {
      href: "/review",
      label: t("Review", "Revisión"),
      icon: ClipboardCheck,
      badge: reviewCount > 0 ? reviewCount : undefined,
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
        <SiteBrand />
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
              {"badge" in item && item.badge !== undefined && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 font-mono text-[0.68rem] tabular-nums ring-1 ring-border">
                  {item.badge}
                </span>
              )}
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
