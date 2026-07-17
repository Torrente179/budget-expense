"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";
import { useReviewCount } from "@/hooks/use-review-queue";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation";
import { SiteBrand } from "./site-brand";

function SidebarLink({
  item,
  active,
  badge,
  label,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-secondary text-foreground ring-1 ring-border"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-subtle px-1.5 font-mono text-label tabular-nums text-warning ring-1 ring-warning/25">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const reviewCount = useReviewCount();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const renderItem = (item: NavItem) => (
    <SidebarLink
      key={item.key}
      item={item}
      active={isNavItemActive(item, pathname)}
      label={t(item.label.en, item.label.es)}
      badge={item.badge === "review" ? reviewCount : undefined}
    />
  );

  return (
    <aside className="hidden border-r border-sidebar-border bg-sidebar md:flex md:w-[268px] md:flex-col">
      <div className="border-b border-sidebar-border px-5 py-5">
        <SiteBrand />
      </div>
      <nav
        aria-label={t("Main navigation", "Navegación principal")}
        className="flex-1 space-y-6 px-3 py-5"
      >
        <div className="space-y-1">{PRIMARY_NAV.map(renderItem)}</div>
        <div className="space-y-1 border-t border-sidebar-border pt-5">
          {SECONDARY_NAV.map(renderItem)}
        </div>
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("Log out", "Cerrar sesión")}
        </button>
      </div>
    </aside>
  );
}
