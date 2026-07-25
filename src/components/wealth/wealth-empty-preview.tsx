"use client";

import { LineChart, PieChart, ShieldCheck, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { PALETTE } from "@/lib/palette";
import { useLocale } from "@/providers/locale-provider";

interface PreviewItem {
  icon: LucideIcon;
  accent: string;
  title: { en: string; es: string };
  body: { en: string; es: string };
}

const ITEMS: PreviewItem[] = [
  {
    icon: LineChart,
    accent: PALETTE.wealth.investments,
    title: { en: "Monthly evolution", es: "Evolución mensual" },
    body: {
      en: "How your net worth changes over time.",
      es: "Cómo cambia tu patrimonio con el tiempo.",
    },
  },
  {
    icon: PieChart,
    accent: PALETTE.wealth.accounts,
    title: { en: "Assets against debts", es: "Activos frente a deudas" },
    body: {
      en: "The balance between what you own and what you owe.",
      es: "El balance entre lo que tienes y lo que debes.",
    },
  },
  {
    icon: ShieldCheck,
    accent: PALETTE.wealth.savings,
    title: { en: "Financial cushion", es: "Colchón financiero" },
    body: {
      en: "How long your savings would cover the essentials.",
      es: "Cuánto te cubrirían tus ahorros los gastos esenciales.",
    },
  },
];

/**
 * "Lo que verás aquí" — shown only before there is any data. It previews the
 * three quick-glance cards instead of rendering them full of zeros, which
 * would read as a broken screen rather than an empty one.
 */
export function WealthEmptyPreview() {
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <SectionHeader title={t("What you'll see here", "Lo que verás aquí")} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
          {ITEMS.map((item) => (
            <div key={item.title.en} className="flex gap-3 sm:block">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:mb-2.5"
                style={{
                  backgroundColor: `${item.accent}1f`,
                  color: item.accent,
                }}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-body font-medium">
                  {t(item.title.en, item.title.es)}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {t(item.body.en, item.body.es)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
