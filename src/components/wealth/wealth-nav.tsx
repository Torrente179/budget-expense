"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/providers/locale-provider";
import {
  UnderlineIndicator,
  underlineTabItemClass,
  underlineTabListClass,
} from "@/components/patterns/underline-tabs";

const SECTION_ITEMS = [
  { href: "/wealth", label: { en: "Overview", es: "Resumen" }, exact: true },
  {
    href: "/wealth/investments",
    label: { en: "Investments", es: "Inversiones" },
  },
  { href: "/wealth/savings", label: { en: "Savings", es: "Ahorros" } },
  { href: "/wealth/loans", label: { en: "Loans", es: "Préstamos" } },
  { href: "/wealth/liabilities", label: { en: "Debts", es: "Deudas" } },
] as const;

/** Underline sub-navigation shared by every Wealth screen. */
export function WealthNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav aria-label="Wealth" className={underlineTabListClass}>
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
            className={underlineTabItemClass(isActive)}
          >
            {t(item.label.en, item.label.es)}
            <UnderlineIndicator active={isActive} />
          </Link>
        );
      })}
    </nav>
  );
}
