"use client";

import Link from "next/link";
import { ArrowRight, CandlestickChart, Loader2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvestments } from "@/hooks/use-investments";
import { useLocale } from "@/providers/locale-provider";

export function InvestmentDashboardSnapshot() {
  const { baseCurrency } = useCurrency();
  const { overview, loading, quoteLoading } = useInvestments();
  const { t } = useLocale();

  return (
    <Card className="border-border/80 bg-card/96">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
              {t("Investments", "Inversiones")}
            </p>
            <CardTitle className="mt-2 font-heading text-[1.45rem] font-semibold tracking-tight">
              {t("Portfolio snapshot", "Resumen del portafolio")}
            </CardTitle>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
            <CandlestickChart className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Loading portfolio metrics", "Cargando métricas del portafolio")}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {t("Market value", "Valor de mercado")}
                </p>
                <p className="mt-3 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatCurrency(overview.totalMarketValue, baseCurrency)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {t("Unrealized P&L", "P&G no realizada")}
                </p>
                <p className="mt-3 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatCurrency(overview.totalUnrealizedPnl, baseCurrency)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {t("Realized P&L", "P&G realizada")}
                </p>
                <p className="mt-3 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatCurrency(overview.totalRealizedPnl, baseCurrency)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {t("Open positions", "Posiciones abiertas")}
                </p>
                <p className="mt-3 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em]">
                  {overview.openPositionsCount}
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {quoteLoading
                ? t(
                    "Refreshing latest daily prices in the background.",
                    "Actualizando en segundo plano los últimos precios diarios."
                  )
                : t(
                    "Investments stay separate from the budget pool and expense totals.",
                    "Las inversiones se mantienen separadas del fondo de presupuesto y del total de gastos."
                  )}
            </p>

            <Link href="/investments">
              <Button className="w-full justify-between">
                {t("Open Investments", "Abrir Inversiones")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
