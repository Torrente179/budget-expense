"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const SECTION_ITEMS = [
  {
    href: "/investments/stocks",
    label: {
      en: "Stocks",
      es: "Stocks",
    },
  },
  {
    href: "/investments/savings",
    label: {
      en: "Savings accounts",
      es: "Cuentas de ahorro",
    },
  },
] as const;

export function InvestmentsSectionNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <div className="rounded-[1.35rem] border border-border/70 bg-card/80 p-1">
      <div className="grid gap-1 sm:grid-cols-2">
        {SECTION_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[1rem] px-3 py-2.5 text-center text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground"
              )}
            >
              {t(item.label.en, item.label.es)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
