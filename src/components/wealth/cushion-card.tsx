"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { StatusTag } from "@/components/patterns/status-tag";
import { CUSHION_LABELS, type Cushion, type CushionTone } from "@/lib/wealth/net-worth";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

/**
 * The cushion meter is INVERTED relative to a budget: a full bar is excellent,
 * not "exceeded". `ProgressMeter` defaults to budget usage bands, where high is
 * bad, so `tone` must always be passed explicitly here — omit it and a perfect
 * six-month cushion renders in critical red.
 */
const METER_TONE: Record<CushionTone, "success" | "warning" | "danger"> = {
  strong: "success",
  good: "success",
  building: "warning",
  critical: "danger",
};

const STATUS_TONE: Record<CushionTone, "success" | "warning" | "danger"> = {
  strong: "success",
  good: "success",
  building: "warning",
  critical: "danger",
};

interface CushionCardProps {
  cushion: Cushion;
  liquidBase: number;
  variant?: "card" | "section";
}

/** Colchón financiero — how many months of essentials the liquid money covers. */
export function CushionCard({
  cushion,
  liquidBase,
  variant = "card",
}: CushionCardProps) {
  const { t, locale } = useLocale();
  const { baseCurrency } = useCurrency();

  const label = CUSHION_LABELS[cushion.tone];

  const header = (
    <SectionHeader
      eyebrow={t("Safety", "Seguridad")}
      title={t("Financial cushion", "Colchón financiero")}
      action={
        cushion.months !== null ? (
          <StatusTag tone={STATUS_TONE[cushion.tone]}>
            {t(label.en, label.es)}
          </StatusTag>
        ) : undefined
      }
    />
  );

  const content = (
    <div className="space-y-4">
        {cushion.months === null ? (
          <div className="space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-body text-muted-foreground">
              {t(
                "Tag some categories as essential and we can work out how long your money would last.",
                "Marca categorías como esenciales y calcularemos cuánto te duraría el dinero."
              )}
            </p>
            <Link
              href="/settings"
              className="inline-block text-caption font-medium text-primary hover:underline"
            >
              {t("Set essentials", "Marcar esenciales")}
            </Link>
          </div>
        ) : (
          <>
            <p className="font-mono text-display tabular-nums tracking-tight">
              {cushion.months.toLocaleString(locale === "es" ? "es-ES" : "en-US", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              <span className="ml-1.5 font-sans text-heading font-medium text-muted-foreground">
                {t("months", "meses")}
              </span>
            </p>

            <div className="space-y-1.5">
              <p className="text-caption text-muted-foreground">
                {t("Monthly expenses covered", "Gastos mensuales cubiertos")}
              </p>
              <ProgressMeter
                ratio={cushion.ratio ?? 0}
                tone={METER_TONE[cushion.tone]}
                ariaLabel={t(
                  "Monthly expenses covered",
                  "Gastos mensuales cubiertos"
                )}
              />
              <div className="flex items-center justify-between text-label text-muted-foreground">
                <span>0</span>
                <span>{cushion.targetMonths}+</span>
              </div>
            </div>

            <p className="text-caption text-muted-foreground">
              {formatCurrency(liquidBase, baseCurrency)}{" "}
              {t("liquid", "líquidos")} ·{" "}
              {t(
                `${cushion.targetMonths}-month target`,
                `objetivo de ${cushion.targetMonths} meses`
              )}
            </p>
          </>
        )}
    </div>
  );

  if (variant === "section") {
    return (
      <section className="min-w-0 space-y-4">
        {header}
        {content}
      </section>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader>{header}</CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
