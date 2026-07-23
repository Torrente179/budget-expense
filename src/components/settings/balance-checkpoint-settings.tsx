"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { getBalanceAdjustmentLabel } from "@/lib/balance-checkpoint";
import {
  formatCurrency,
  parseLocalizedCurrencyInput,
} from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export function BalanceCheckpointSettings() {
  const { t, intlLocale, locale } = useLocale();
  const {
    baseCurrency,
    isLoading: currencyLoading,
    currencyPreferenceReady,
  } = useCurrency();
  const queryClient = useQueryClient();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = format(now, "yyyy-MM-dd");
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const { summary, loading } = useMonthlySummary({ month, year });
  const [balanceInput, setBalanceInput] = useState("");
  const [saving, setSaving] = useState(false);

  const enteredBalance = useMemo(
    () => parseLocalizedCurrencyInput(balanceInput, intlLocale),
    [balanceInput, intlLocale]
  );
  const hasEnteredBalance = Number.isFinite(enteredBalance);
  const invalidBalance = balanceInput.trim().length > 0 && !hasEnteredBalance;
  const hasTrackedBalance =
    summary.balanceTrackingStatus === "tracked" &&
    summary.trackedBalance !== null;
  const calculatedBalanceBefore = hasTrackedBalance
    ? summary.trackedBalance!
    : summary.monthToDateNetFlow;
  const reconciliationDelta =
    hasEnteredBalance && calculatedBalanceBefore !== null
    ? enteredBalance - calculatedBalanceBefore
    : null;
  const canSave =
    !loading &&
    !currencyLoading &&
    currencyPreferenceReady &&
    !saving &&
    hasEnteredBalance &&
    calculatedBalanceBefore !== null &&
    summary.balanceTrackingStatus !== "unavailable" &&
    summary.balanceTrackingStatus !== "future";

  async function handleSave() {
    if (!canSave) {
      toast.error(
        t(
          "Enter a valid available balance",
          "Introduce un saldo disponible válido"
        )
      );
      return;
    }

    setSaving(true);
    try {
      await authorizedFetch("/api/balance-checkpoints", {
        method: "POST",
        body: JSON.stringify({
          balance: enteredBalance,
          expectedCurrency: baseCurrency,
          asOfDate: today,
          calculatedBalanceBefore,
          calculationStartDate: hasTrackedBalance
            ? summary.balanceCheckpointDate
            : monthStart,
          calculationBasis: hasTrackedBalance
            ? "tracked_balance"
            : "monthly_net",
        }),
      });
      setBalanceInput("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.monthSnapshotAll,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
      ]);
      toast.success(t("Balance reconciled", "Saldo conciliado"));
    } catch (error) {
      console.error("Failed to reconcile available balance", error);
      toast.error(
        t(
          "Could not reconcile the balance",
          "No se pudo conciliar el saldo"
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const lastCheckpoint = summary.balanceCheckpoint;
  const checkpointDateLabel = lastCheckpoint
    ? new Intl.DateTimeFormat(intlLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${lastCheckpoint.as_of_date}T00:00:00Z`))
    : null;
  const formatSignedAmount = (amount: number, currency: string) => {
    const absolute = formatCurrency(Math.abs(amount), currency, intlLocale);
    if (amount > 0) return `+${absolute}`;
    if (amount < 0) return `−${absolute}`;
    return absolute;
  };

  return (
    <Card id="available-balance" className="scroll-mt-20 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("Available balance", "Saldo disponible")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "Enter what your bank shows after recording today's existing movements. Any surplus or deficit is recorded as a movement with today's date, then the reconciled balance carries forward.",
            "Ingresa lo que muestra tu banco después de registrar los movimientos existentes de hoy. Cualquier superávit o déficit se registra como movimiento con la fecha de hoy, y el saldo conciliado continúa desde ahí."
          )}
        </p>

        {lastCheckpoint && (
          <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-caption">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-muted-foreground">
                {t("Last reconciliation", "Última conciliación")} ·{" "}
                {checkpointDateLabel}
              </span>
              <span className="font-mono font-medium tabular-nums">
                {formatCurrency(
                  Number(lastCheckpoint.balance),
                  lastCheckpoint.currency,
                  intlLocale
                )}
              </span>
            </div>
            {lastCheckpoint.reconciliation_delta !== null && (
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-muted-foreground">
                <span>
                  {(() => {
                    const label = getBalanceAdjustmentLabel({
                      delta: Number(lastCheckpoint.reconciliation_delta),
                      calculationBasis: lastCheckpoint.calculation_basis,
                    });
                    if (!label) {
                      return t(
                        "Reconciliation adjustment",
                        "Ajuste de conciliación"
                      );
                    }
                    return locale === "es" ? label.es : label.en;
                  })()}
                </span>
                <span className="font-mono tabular-nums">
                  {formatSignedAmount(
                    Number(lastCheckpoint.reconciliation_delta),
                    lastCheckpoint.currency
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="available-balance-input">
              {t(
                "Available bank balance today",
                "Saldo disponible que muestra tu banco"
              )}
            </Label>
            <div className="flex max-w-sm items-center gap-2">
              <Input
                id="available-balance-input"
                inputMode="decimal"
                value={balanceInput}
                onChange={(event) => setBalanceInput(event.target.value)}
                placeholder={t("e.g. 7,025,963.50", "ej. 7.025.963,50")}
                className="font-mono tabular-nums"
                disabled={
                  saving || currencyLoading || !currencyPreferenceReady
                }
                aria-invalid={invalidBalance || undefined}
                aria-describedby={
                  invalidBalance
                    ? "available-balance-help available-balance-currency available-balance-error"
                    : "available-balance-help available-balance-currency"
                }
              />
              <span
                id="available-balance-currency"
                className="shrink-0 text-sm font-medium text-muted-foreground"
              >
                {baseCurrency}
              </span>
            </div>
            <p id="available-balance-help" className="text-xs text-muted-foreground">
              {t(
                "Import or enter movements already posted today before reconciling. No bank account details are stored.",
                "Importa o registra primero los movimientos ya contabilizados hoy. No se guardan datos de la cuenta bancaria."
              )}
            </p>
            {invalidBalance && (
              <p
                id="available-balance-error"
                role="alert"
                className="text-xs font-medium text-danger"
              >
                {t(
                  "Use a valid amount with no more than two decimals.",
                  "Usa un monto válido con máximo dos decimales."
                )}
              </p>
            )}
          </div>

          {reconciliationDelta !== null && (
            <div className="rounded-lg bg-secondary/50 px-3 py-2 text-caption text-muted-foreground">
              <div>
                <span>
                  {(() => {
                    const label = getBalanceAdjustmentLabel({
                      delta: reconciliationDelta,
                      calculationBasis: hasTrackedBalance
                        ? "tracked_balance"
                        : "monthly_net",
                    });
                    if (!label) {
                      return t(
                        "Reconciliation adjustment",
                        "Ajuste de conciliación"
                      );
                    }
                    return locale === "es" ? label.es : label.en;
                  })()}
                  {": "}
                </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatSignedAmount(reconciliationDelta, baseCurrency)}
                </span>
              </div>
              <p className="mt-1 text-xs">
                {hasTrackedBalance
                  ? t(
                      "Available bank balance − tracked balance.",
                      "Saldo disponible del banco − saldo calculado."
                    )
                  : t(
                      "Available bank balance − month-to-date net flow.",
                      "Saldo disponible del banco − flujo neto del mes hasta hoy."
                    )}{" "}
                {t(
                  "A surplus is recorded as income; a deficit as an expense.",
                  "Un superávit se registra como ingreso; un déficit como gasto."
                )}
              </p>
            </div>
          )}

          {summary.balanceTrackingStatus === "unavailable" && !loading && (
            <p className="text-xs font-medium text-danger">
              {t(
                "Balance tracking is temporarily unavailable.",
                "El seguimiento del saldo no está disponible temporalmente."
              )}
            </p>
          )}

          {!loading &&
            summary.balanceTrackingStatus === "untracked" &&
            summary.monthToDateNetFlow === null && (
              <p className="text-xs font-medium text-danger">
                {t(
                  "The month-to-date comparison is temporarily unavailable.",
                  "La comparación del mes hasta hoy no está disponible temporalmente."
                )}
              </p>
            )}

          {!currencyLoading && !currencyPreferenceReady && (
            <p className="text-xs font-medium text-danger">
              {t(
                "Could not load your profile currency. Try again before reconciling.",
                "No se pudo cargar la moneda de tu perfil. Inténtalo de nuevo antes de conciliar."
              )}
            </p>
          )}

          <Button type="submit" size="sm" disabled={!canSave}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {t("Reconcile balance", "Conciliar saldo")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
