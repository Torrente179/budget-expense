"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Settings,
  LogOut,
  BookOpenText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/wisdom", label: "Sabiduría", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
    <aside className="hidden border-r border-sidebar-border/70 bg-sidebar/90 backdrop-blur md:flex md:w-[252px] md:flex-col">
      <div className="border-b border-sidebar-border/70 px-5 py-5">
        <Link href="/dashboard" className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-[0_16px_35px_-22px_rgba(49,84,71,0.8)]">
            <span className="text-sm font-semibold tracking-[0.16em] text-primary-foreground">
              BE
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[0.7rem] uppercase tracking-[0.26em] text-muted-foreground">
              Stewardship
            </span>
            <span className="block font-heading text-2xl leading-none tracking-tight">
              Budget & Expense
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_18px_40px_-24px_rgba(49,84,71,0.75)]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border/70 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
