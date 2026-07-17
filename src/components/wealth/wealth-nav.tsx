"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const SECTION_ITEMS = [
  { href: "/wealth", label: { en: "Overview", es: "Resumen" }, exact: true },
  {
    href: "/wealth/investments",
    label: { en: "Investments", es: "Inversiones" },
  },
  { href: "/wealth/savings", label: { en: "Savings", es: "Ahorros" } },
  { href: "/wealth/liabilities", label: { en: "Debts", es: "Deudas" } },
] as const;

/** Chip sub-navigation shared by every Wealth screen. */
export function WealthNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {SECTION_ITEMS.map((item) => {
        const isActive =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t(item.label.en, item.label.es)}
          </Link>
        );
      })}
    </div>
  );
}
