"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { WealthItemDetail } from "@/components/wealth/wealth-item-detail";
import { useWealthInvestments } from "@/hooks/use-wealth-investments";
import { PALETTE } from "@/lib/palette";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

/**
 * A manually valued holding. Its one recurring action is **update the value**,
 * because nothing else will: there is no price feed behind these.
 */
export default function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const router = useRouter();
  const { investments, loading, updateInvestment } = useWealthInvestments();
  const [newValue, setNewValue] = useState("");

  const item = investments.find((entry) => entry.id === id);

  if (loading) {
    return (
      <Screen title={t("Investment", "Inversión")} backHref="/wealth/investments">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen title={t("Investment", "Inversión")} backHref="/wealth/investments">
        <p className="py-10 text-center text-body text-muted-foreground">
          {t(
            "This investment no longer exists.",
            "Esta inversión ya no existe."
          )}
        </p>
      </Screen>
    );
  }

  const parsedNewValue = parseDecimalInput(newValue);
  const gainColor =
    item.gainBase === 0
      ? undefined
      : item.gainBase > 0
        ? PALETTE.cashflow.income
        : PALETTE.cashflow.expense;

  async function handleRevalue() {
    if (parsedNewValue === null || !item) return;
    await updateInvestment.mutateAsync({
      id: item.id,
      values: {
        current_value: parsedNewValue,
        valued_on: new Date().toISOString().slice(0, 10),
      },
    });
    setNewValue("");
    toast.success(t("Value updated", "Valor actualizado"));
  }

  return (
    <WealthItemDetail
      title={item.name}
      breadcrumb={t("Investments", "Inversiones")}
      backHref="/wealth/investments"
      eyebrow={t("Current value", "Valor actual")}
      amount={item.valueBase}
      icon={TrendingUp}
      stats={[
        {
          label: t("Contributed", "Aportado"),
          value: formatCurrency(item.costBase, baseCurrency),
        },
        {
          label: t("Unrealized", "No realizada"),
          value: `${item.gainBase > 0 ? "+" : ""}${formatCurrency(item.gainBase, baseCurrency)}`,
          tone: item.gainBase >= 0 ? "positive" : "negative",
        },
        {
          label: t("Return", "Rentabilidad"),
          value:
            item.returnRatio !== null
              ? `${item.returnRatio > 0 ? "+" : ""}${(item.returnRatio * 100).toFixed(2)}%`
              : "—",
          tone: item.gainBase >= 0 ? "positive" : "negative",
        },
      ]}
      movements={[]}
      onArchive={async () => {
        await updateInvestment.mutateAsync({
          id: item.id,
          values: { status: "archived" },
        });
        toast.success(t("Investment archived", "Inversión archivada"));
        router.push("/wealth/investments");
      }}
    >
      <Card>
        <CardHeader>
          <SectionHeader
            eyebrow={t("Manual", "Manual")}
            title={t("Update the value", "Actualizar el valor")}
            description={t(
              `Last valued on ${item.valued_on}. A change in market value moves your net worth, but it is not income.`,
              `Valorada por última vez el ${item.valued_on}. Un cambio de valor mueve tu patrimonio, pero no es un ingreso.`
            )}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[10rem] flex-1 space-y-1.5">
              <Label htmlFor="revalue-input">
                {t("New value", "Nuevo valor")} ({item.currency})
              </Label>
              <Input
                id="revalue-input"
                inputMode="decimal"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder={String(item.current_value)}
              />
            </div>
            <Button
              onClick={handleRevalue}
              disabled={parsedNewValue === null || updateInvestment.isPending}
            >
              {t("Save value", "Guardar valor")}
            </Button>
          </div>

          {parsedNewValue !== null && (
            <p className="text-caption text-muted-foreground">
              {t("Change", "Cambio")}:{" "}
              <span
                className="font-mono tabular-nums"
                style={{ color: gainColor }}
              >
                {parsedNewValue - Number(item.current_value) > 0 ? "+" : ""}
                {formatCurrency(
                  parsedNewValue - Number(item.current_value),
                  item.currency
                )}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </WealthItemDetail>
  );
}
