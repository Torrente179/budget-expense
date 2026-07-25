"use client";

import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  HandCoins,
  PiggyBank,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/patterns/section-header";
import { PALETTE, type WealthCategory } from "@/lib/palette";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface CategoryDefinition {
  key: WealthCategory;
  href: string;
  icon: LucideIcon;
  label: { en: string; es: string };
  blurb: { en: string; es: string };
  emptyCta: { en: string; es: string };
  /** Both forms — "1 loans" reads like a bug even when the number is right. */
  unitOne: { en: string; es: string };
  unitMany: { en: string; es: string };
}

const CATEGORIES: CategoryDefinition[] = [
  {
    key: "accounts",
    href: "/wealth/accounts",
    icon: Wallet,
    label: { en: "Accounts & cash", es: "Cuentas y efectivo" },
    blurb: {
      en: "Current accounts, cash and wallets.",
      es: "Cuentas corrientes, efectivo y monederos.",
    },
    emptyCta: { en: "Add your first account", es: "Añadir tu primera cuenta" },
    unitOne: { en: "account", es: "cuenta" },
    unitMany: { en: "accounts", es: "cuentas" },
  },
  {
    key: "savings",
    href: "/wealth/savings",
    icon: PiggyBank,
    label: { en: "Savings", es: "Ahorros" },
    blurb: {
      en: "Money set aside for your goals.",
      es: "Dinero reservado para tus metas.",
    },
    emptyCta: { en: "Add your first fund", es: "Añadir tu primer fondo" },
    unitOne: { en: "fund", es: "fondo" },
    unitMany: { en: "funds", es: "fondos" },
  },
  {
    key: "investments",
    href: "/wealth/investments",
    icon: TrendingUp,
    label: { en: "Investments", es: "Inversiones" },
    blurb: {
      en: "Grow your money over the long run.",
      es: "Haz crecer tu dinero a largo plazo.",
    },
    emptyCta: { en: "Add an investment", es: "Añadir una inversión" },
    unitOne: { en: "position", es: "posición" },
    unitMany: { en: "positions", es: "posiciones" },
  },
  {
    key: "lent",
    href: "/wealth/loans",
    icon: HandCoins,
    label: { en: "Money lent", es: "Dinero prestado" },
    blurb: {
      en: "What friends or family owe you.",
      es: "Lo que te deben amigos o familiares.",
    },
    emptyCta: { en: "Record a loan", es: "Registrar un préstamo" },
    unitOne: { en: "loan", es: "préstamo" },
    unitMany: { en: "loans", es: "préstamos" },
  },
  {
    key: "debts",
    href: "/wealth/liabilities",
    icon: CreditCard,
    label: { en: "Debts", es: "Deudas" },
    blurb: {
      en: "Loans, cards and other obligations.",
      es: "Préstamos, tarjetas y otras deudas.",
    },
    emptyCta: { en: "Add a debt", es: "Añadir una deuda" },
    unitOne: { en: "debt", es: "deuda" },
    unitMany: { en: "debts", es: "deudas" },
  },
];

interface OrganizeMoneyGridProps {
  totals: Record<WealthCategory, number>;
  counts: Record<WealthCategory, number>;
  /** Empty hides the amounts and shows the "add your first" affordance. */
  isEmpty: boolean;
}

/**
 * "Organiza tu dinero" — the five doors into the balance sheet.
 *
 * Every card opens its parent page, even when the category is empty. Opening a
 * page sometimes and a modal other times is the kind of inconsistency users
 * cannot form a habit around.
 */
export function OrganizeMoneyGrid({
  totals,
  counts,
  isEmpty,
}: OrganizeMoneyGridProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  return (
    <section className="space-y-3">
      <SectionHeader title={t("Organize your money", "Organiza tu dinero")} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => {
          const accent = PALETTE.wealth[category.key];
          const count = counts[category.key] ?? 0;
          const total = totals[category.key] ?? 0;
          const showAmount = !isEmpty && count > 0;

          return (
            <Link
              key={category.key}
              href={category.href}
              className="group flex items-center gap-3.5 rounded-xl bg-card px-4 py-3.5 ring-1 ring-border shadow-1 transition-all hover:shadow-2 hover:ring-border/80"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${accent}1f`, color: accent }}
              >
                <category.icon className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-body font-semibold"
                  style={{ color: accent }}
                >
                  {t(category.label.en, category.label.es)}
                </span>

                {showAmount ? (
                  <>
                    <span className="block truncate font-mono text-heading font-semibold tabular-nums text-foreground">
                      {formatCurrency(total, baseCurrency)}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {count}{" "}
                      {count === 1
                        ? t(category.unitOne.en, category.unitOne.es)
                        : t(category.unitMany.en, category.unitMany.es)}
                    </span>
                  </>
                ) : (
                  <span className="mt-0.5 block text-caption text-muted-foreground">
                    {isEmpty
                      ? t(category.blurb.en, category.blurb.es)
                      : t(category.emptyCta.en, category.emptyCta.es)}
                  </span>
                )}
              </span>

              <ChevronRight
                aria-hidden
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground/50",
                  "transition-transform group-hover:translate-x-0.5"
                )}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
