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
    <div className="flex gap-6 border-b border-border/60">
      {SECTION_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "pb-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground"
            )}
          >
            {t(item.label.en, item.label.es)}
          </Link>
        );
      })}
    </div>
  );
}
