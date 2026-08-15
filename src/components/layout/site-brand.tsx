"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
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
  href = "/home",
  onClick,
}: SiteBrandProps) {
  const { t } = useLocale();

  const iconSize = compact ? 32 : 40;
  const content = (
    <>
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-2",
          compact && "rounded-lg"
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
          <span className="block label-caps text-white/42">
            {t("Stewardship", "Mayordomía")}
          </span>
          <span className="block text-lg font-semibold leading-none tracking-tight text-white">
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
