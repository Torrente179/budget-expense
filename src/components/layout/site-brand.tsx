"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

type SiteBrandProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  onClick?: () => void;
};

export function SiteBrand({
  className,
  compact = false,
  href = "/dashboard",
  onClick,
}: SiteBrandProps) {
  const { t } = useLocale();

  const iconSize = compact ? 32 : 40;
  const content = (
    <>
      <div
        className={cn(
          "shrink-0 overflow-hidden border border-border/80 bg-secondary shadow-[0_10px_30px_rgba(0,0,0,0.16)]",
          compact ? "rounded-[1rem]" : "rounded-[1.15rem]"
        )}
      >
        <Image
          src="/icons/budget-expense-app-icon.png"
          alt="Budget & Expense logo"
          width={iconSize}
          height={iconSize}
          sizes={`${iconSize}px`}
          className="h-auto w-auto object-cover"
          priority
        />
      </div>
      {!compact ? (
        <div className="space-y-1">
          <span className="block text-[0.7rem] uppercase tracking-[0.26em] text-muted-foreground">
            {t("Stewardship", "Mayordomía")}
          </span>
          <span className="block text-lg font-semibold leading-none tracking-tight">
            Budget & Expense
          </span>
        </div>
      ) : null}
    </>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="Budget & Expense"
      className={cn(
        "flex items-center gap-3",
        compact ? "justify-center" : "items-start",
        className
      )}
    >
      {content}
    </Link>
  );
}
