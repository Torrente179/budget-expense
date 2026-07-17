"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { CURRENCIES } from "@/lib/constants";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Liability = Database["public"]["Tables"]["liabilities"]["Row"];
type LiabilityPayment =
  Database["public"]["Tables"]["liability_payments"]["Row"];

const liabilitiesKey = ["liabilities"] as const;

/** Loans, mortgages, credit balances — with payments reducing the balance. */
export function LiabilitiesEditor() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: liabilitiesKey,
    queryFn: () =>
      authorizedFetch<{
        liabilities: Liability[];
        payments: LiabilityPayment[];
      }>("/api/liabilities"),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: liabilitiesKey }),
      queryClient.invalidateQueries({ queryKey: ["household-insights"] }),
    ]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("loan");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [rate, setRate] = useState("");

  const addLiability = useMutation({
    mutationFn: () => {
      const parsedBalance = parseDecimalInput(balance);
      if (
        typeof parsedBalance !== "number" ||
        !Number.isFinite(parsedBalance) ||
        parsedBalance < 0
      ) {
        throw new Error(t("Invalid balance", "Saldo inválido"));
      }
      const parsedRate = rate.trim()
        ? Number(rate.replace(",", "."))
        : null;
      return authorizedFetch("/api/liabilities", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          kind,
          original_balance: parsedBalance,
          currency,
          interest_rate_percent: parsedRate,
        }),
      });
    },
    onSuccess: async () => {
      await invalidate();
      setShowForm(false);
      setName("");
      setBalance("");
      setRate("");
      toast.success(t("Liability added", "Pasivo añadido"));
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not add the liability", "No se pudo añadir el pasivo")
      ),
  });

  const kinds = [
    { value: "loan", label: t("Loan", "Préstamo") },
    { value: "mortgage", label: t("Mortgage", "Hipoteca") },
    { value: "credit_card", label: t("Credit card", "Tarjeta de crédito") },
    { value: "personal", label: t("Personal debt", "Deuda personal") },
    { value: "other", label: t("Other", "Otro") },
  ];

  return (
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
        ) : data && data.liabilities.length === 0 && !showForm ? (
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

        {showForm ? (
          <div className="space-y-3 rounded-lg bg-secondary/40 p-3 ring-1 ring-border">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="liability-name">{t("Name", "Nombre")}</Label>
                <Input
                  id="liability-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("e.g. Car loan", "p. ej. Préstamo del coche")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Type", "Tipo")}</Label>
                <Select value={kind} onValueChange={(v) => v && setKind(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kinds.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="liability-balance">
                  {t("Current balance", "Saldo actual")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="liability-balance"
                    inputMode="decimal"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                    className="font-mono tabular-nums"
                  />
                  <Select
                    value={currency}
                    onValueChange={(v) => v && setCurrency(v as typeof currency)}
                  >
                    <SelectTrigger className="w-24 font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="liability-rate">
                  {t("Interest % (optional)", "Interés % (opcional)")}
                </Label>
                <Input
                  id="liability-rate"
                  inputMode="decimal"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addLiability.mutate()}
                disabled={addLiability.isPending || !name.trim() || !balance.trim()}
              >
                {addLiability.isPending && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {t("Add liability", "Añadir pasivo")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                {t("Cancel", "Cancelar")}
              </Button>
            </div>
          </div>
        ) : (
          !isError && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus />
              {t("Add liability", "Añadir pasivo")}
            </Button>
          )
        )}

        <p className="text-xs text-muted-foreground">
          {t("Balances shown in", "Saldos mostrados en")} {baseCurrency}{" "}
          {t("where converted.", "cuando se convierten.")}
        </p>
      </CardContent>
    </Card>
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
            {liability.kind}
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
