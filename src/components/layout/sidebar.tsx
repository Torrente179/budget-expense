"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";
import {
  IMPORT_NAV,
  MENU_NAV,
  PRIMARY_NAV,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation";
import { SiteBrand } from "./site-brand";
import { NavigationPendingIndicator } from "./navigation-pending-indicator";

const ROW =
  "relative flex min-h-11 items-center gap-3 rounded-full px-4 text-body font-semibold transition-colors duration-[var(--motion-standard)]";

function SidebarLink({
  item,
  active,
  label,
  staticPreview,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  staticPreview: boolean;
}) {
  return (
    <Link
      href={item.href}
      prefetch={staticPreview ? false : undefined}
      onClick={staticPreview ? (event) => event.preventDefault() : undefined}
      aria-disabled={staticPreview || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        ROW,
        active
          ? "bg-card text-foreground ring-1 ring-inset ring-border"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "h-[1.125rem] w-[1.125rem] shrink-0",
          active && "stroke-[2.25] text-coral"
        )}
      />
      {label}
      <NavigationPendingIndicator />
    </Link>
  );
}

/**
 * The desktop navigation column, presentational only. It sits on the page
 * ground itself, separated by one hairline, so the app reads as one surface
 * rather than a dark rail beside a light page. The active section is a raised
 * pill with an accent icon — the same language as the phone's tab bar.
 *
 * Import is an action at the foot of the column, not a row in "More". Review
 * has no row at all: Home prompts for it whenever something is waiting.
 */
export function SidebarView({
  pathname,
  onLogout,
  staticPreview = false,
}: {
  pathname: string;
  onLogout?: () => void;
  /** Keep links inert in fixtures: no prefetch, no navigation. */
  staticPreview?: boolean;
}) {
  const { t } = useLocale();

  const renderItem = (item: NavItem) => (
    <SidebarLink
      key={item.key}
      item={item}
      active={isNavItemActive(item, pathname)}
      label={t(item.label.en, item.label.es)}
      staticPreview={staticPreview}
    />
  );

  return (
    <aside className="hidden shrink-0 border-r border-border bg-background text-foreground md:flex md:w-[248px] md:flex-col">
      <div className="px-5 pb-6 pt-6">
        <SiteBrand />
      </div>
      <nav
        aria-label={t("Main navigation", "Navegación principal")}
        className="flex-1 space-y-7 px-3"
      >
        <div className="space-y-1">{PRIMARY_NAV.map(renderItem)}</div>
        <div className="space-y-1">
          <p className="label-caps px-4 pb-1.5">{t("More", "Más")}</p>
          {MENU_NAV.map(renderItem)}
        </div>
      </nav>
      <div className="space-y-1 px-3 py-4">
        <Link
          href={IMPORT_NAV.href}
          prefetch={staticPreview ? false : undefined}
          onClick={
            staticPreview ? (event) => event.preventDefault() : undefined
          }
          aria-disabled={staticPreview || undefined}
          aria-current={
            isNavItemActive(IMPORT_NAV, pathname) ? "page" : undefined
          }
          className={cn(
            ROW,
            "mb-2 justify-center border border-input text-foreground hover:bg-card",
            isNavItemActive(IMPORT_NAV, pathname) && "bg-card"
          )}
        >
          <IMPORT_NAV.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
          {t("Import statement", "Importar extracto")}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            ROW,
            "w-full text-muted-foreground hover:bg-card/60 hover:text-foreground"
          )}
        >
          <LogOut className="h-[1.125rem] w-[1.125rem]" />
          {t("Log out", "Cerrar sesión")}
        </button>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarView
      pathname={pathname}
      onLogout={handleLogout}
    />
  );
}
