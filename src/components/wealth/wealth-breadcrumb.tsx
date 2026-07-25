"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

/**
 * "Patrimonio / Ahorros" — the trail on a pushed Wealth screen.
 *
 * Replaces the old five-item underline sub-nav. Wealth is now a hub with
 * pushed category pages (Patrimonio → category → item), so lateral tabs
 * across five siblings no longer describe the shape of the section. `Screen`'s
 * back chevron handles the return; this names where you are.
 */
export function WealthBreadcrumb({ current }: { current: string }) {
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("Breadcrumb", "Ruta")}
      className="flex items-center gap-1 text-caption"
    >
      <Link
        href="/wealth"
        className="font-medium text-primary transition-opacity hover:opacity-80"
      >
        {t("Net worth", "Patrimonio")}
      </Link>
      <ChevronRight aria-hidden className="h-3 w-3 text-muted-foreground/60" />
      <span aria-current="page" className="text-muted-foreground">
        {current}
      </span>
    </nav>
  );
}
