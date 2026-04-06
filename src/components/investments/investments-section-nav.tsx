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
    <div className="flex gap-2 sm:gap-6 sm:border-b sm:border-border/60">
      {SECTION_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:rounded-none sm:border-0 sm:border-b-2 sm:px-0 sm:pb-2.5 sm:text-sm",
              isActive
                ? "border-foreground bg-foreground/10 text-foreground sm:bg-transparent"
                : "border-border text-muted-foreground sm:border-transparent"
            )}
          >
            {t(item.label.en, item.label.es)}
          </Link>
        );
      })}
    </div>
  );
}
