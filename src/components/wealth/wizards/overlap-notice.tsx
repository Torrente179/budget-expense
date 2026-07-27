"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface OverlapNoticeProps {
  /** Where the same money might already live. */
  href: string;
  linkLabel: string;
  message: string;
}

/**
 * Non-blocking warning for the one genuine overlap in Patrimonio: a bank
 * savings account can be recorded as a `wealth_accounts` row of kind `savings`
 * **or** as a savings fund, and both count toward net worth.
 *
 * The product deliberately offers both — a fund with a goal is not the same
 * object as a current account — so this warns rather than prevents, the same
 * way `BudgetWizard` handles two envelopes sharing a category.
 */
export function OverlapNotice({
  href,
  linkLabel,
  message,
}: OverlapNoticeProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-warning-subtle px-3.5 py-3">
      <AlertTriangle
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
      />
      <p className="min-w-0 text-caption text-foreground">
        {message}{" "}
        <Link href={href} className="font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
        {". "}
        {t(
          "Adding it in both places would count the same money twice.",
          "Añadirlo en los dos sitios contaría el mismo dinero dos veces."
        )}
      </p>
    </div>
  );
}
