"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { WealthCategoryHero } from "@/components/wealth/wealth-category-hero";
import {
  DebtWizard,
  type DebtWizardValues,
} from "@/components/wealth/wizards/debt-wizard";
import { CreditCard, Landmark, Plus, Trash2 } from "lucide-react";
import { liabilityKindLabel } from "@/lib/liability-kinds";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Liability = Database["public"]["Tables"]["liabilities"]["Row"];
type LiabilityPayment =
  Database["public"]["Tables"]["liability_payments"]["Row"];

/** Loans, mortgages, credit balances — with payments reducing the balance. */
export function LiabilitiesEditor() {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.liabilities,
    queryFn: () =>
      authorizedFetch<{
        liabilities: Liability[];
        payments: LiabilityPayment[];
      }>("/api/liabilities"),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.liabilities }),
      queryClient.invalidateQueries({ queryKey: queryKeys.householdInsights }),
    ]);

  const [wizardOpen, setWizardOpen] = useState(false);

  const addLiability = useMutation({
    mutationFn: (values: DebtWizardValues) =>
      authorizedFetch("/api/liabilities", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          kind: values.kind,
          original_balance: values.original_balance,
          currency: values.currency,
          interest_rate_percent: values.interest_rate_percent,
          notes: values.notes,
        }),
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success(t("Debt added", "Deuda añadida"));
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not add the debt", "No se pudo añadir la deuda")
      ),
  });

  const activeLiabilities = (data?.liabilities ?? []).filter(
    (liability) => liability.is_active
  );

  /** Outstanding = original − Σ payments, floored at zero, in base currency. */
  const outstandingBase = useMemo(
    () =>
      activeLiabilities.reduce((sum, liability) => {
        const paid = (data?.payments ?? [])
          .filter((payment) => payment.liability_id === liability.id)
          .reduce((total, payment) => total + Number(payment.amount), 0);
        const remaining = Math.max(
          Number(liability.original_balance) - paid,
          0
        );
        return sum + convert(remaining, liability.currency);
      }, 0),
    [activeLiabilities, data?.payments, convert]
  );

  const originalBase = useMemo(
    () =>
      activeLiabilities.reduce(
        (sum, liability) =>
          sum + convert(Number(liability.original_balance), liability.currency),
        0
      ),
    [activeLiabilities, convert]
  );

  const paidBase = Math.max(originalBase - outstandingBase, 0);

  return (
    <>
      <WealthCategoryHero
        eyebrow={t("Outstanding debt", "Deuda pendiente")}
        amount={outstandingBase}
        icon={CreditCard}
        progress={
          originalBase > 0
            ? { ratio: paidBase / originalBase, label: t("Paid off", "Pagado") }
            : null
        }
        stats={[
          {
            label: t("Paid so far", "Pagado hasta hoy"),
            value: formatCurrency(paidBase, baseCurrency),
            tone: "positive",
          },
          {
            label: t("Original", "Importe original"),
            value: formatCurrency(originalBase, baseCurrency),
          },
          {
            label: t("Active", "Activas"),
            value: String(activeLiabilities.length),
          },
        ]}
      />

      <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("Liabilities", "Pasivos")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "Debts you owe. Payments reduce the balance; net worth subtracts what remains.",
            "Deudas pendientes. Los pagos reducen el saldo; el patrimonio neto resta lo que queda."
          )}
        </p>

        {isError ? (
          <p className="text-sm text-destructive">
            {t(
              "Liabilities need the 2026-07-03 migration — see docs/pending-migrations-runbook.md",
              "Los pasivos requieren la migración 2026-07-03 — ver docs/pending-migrations-runbook.md"
            )}
          </p>
        ) : isPending ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : data && data.liabilities.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={t("Debt-free", "Sin deudas")}
            description={t(
              "Nothing to subtract from your net worth.",
              "Nada que restar de tu patrimonio."
            )}
          />
        ) : (
          <ul className="space-y-3">
            {data?.liabilities.map((liability) => (
              <LiabilityRow
                key={liability.id}
                liability={liability}
                payments={
                  data.payments.filter(
                    (payment) => payment.liability_id === liability.id
                  ) ?? []
                }
                onChanged={invalidate}
              />
            ))}
          </ul>
        )}

        {!isError && (
          <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)}>
            <Plus />
            {t("Add debt", "Añadir deuda")}
          </Button>
        )}
      </CardContent>
      </Card>

      <DebtWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={(values) => addLiability.mutateAsync(values)}
      />
    </>
  );
}

function LiabilityRow({
  liability,
  payments,
  onChanged,
}: {
  liability: Liability;
  payments: LiabilityPayment[];
  onChanged: () => Promise<unknown>;
}) {
  const { t } = useLocale();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const paidTotal = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const currentBalance = Math.max(
    Number(liability.original_balance) - paidTotal,
    0
  );

  async function addPayment() {
    const parsed = parseDecimalInput(paymentAmount);
    if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed === 0) {
      toast.error(t("Invalid amount", "Importe inválido"));
      return;
    }
    setBusy(true);
    try {
      await authorizedFetch(`/api/liabilities/${liability.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          payment_date: new Date().toISOString().slice(0, 10),
          amount: parsed,
          currency: liability.currency,
        }),
      });
      setPaymentAmount("");
      await onChanged();
    } catch {
      toast.error(t("Could not record payment", "No se pudo registrar el pago"));
    } finally {
      setBusy(false);
    }
  }

  async function removeLiability() {
    if (
      !window.confirm(
        t(
          `Delete "${liability.name}" and its payment history?`,
          `¿Eliminar "${liability.name}" y su historial de pagos?`
        )
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await authorizedFetch(`/api/liabilities/${liability.id}`, {
        method: "DELETE",
      });
      await onChanged();
    } catch {
      toast.error(t("Could not delete", "No se pudo eliminar"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-2 rounded-lg bg-card p-3 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{liability.name}</p>
          <p className="text-xs text-muted-foreground">
            {liabilityKindLabel(liability.kind, t)}
            {liability.interest_rate_percent != null &&
              ` · ${liability.interest_rate_percent}%`}
            {` · ${payments.length} ${t("payments", "pagos")}`}
          </p>
        </div>
        <span className="font-mono text-sm tabular-nums">
          {formatCurrency(currentBalance, liability.currency)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={removeLiability}
          disabled={busy}
          aria-label={t("Delete liability", "Eliminar pasivo")}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          inputMode="decimal"
          placeholder={t("Payment amount", "Importe del pago")}
          value={paymentAmount}
          onChange={(event) => setPaymentAmount(event.target.value)}
          className="h-8 max-w-[180px] font-mono text-sm tabular-nums"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addPayment}
          disabled={busy || !paymentAmount.trim()}
        >
          {t("Record payment", "Registrar pago")}
        </Button>
      </div>
    </li>
  );
}
