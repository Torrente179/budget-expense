"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2, Plus, Trash2 } from "lucide-react";
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
import { queryKeys } from "@/lib/query/keys";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];
type LoanPerson = Database["public"]["Tables"]["loan_people"]["Row"];

const loansKey = ["loans"] as const;

function formatLoanDate(isoDate: string, locale: string) {
  try {
    return format(parseISO(isoDate), "d MMM yyyy", {
      locale: locale === "es" ? esLocale : enUS,
    });
  } catch {
    return isoDate;
  }
}

/** Money you lent — repayments reduce outstanding; dual-writes movements. */
export function LoansEditor() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: loansKey,
    queryFn: () =>
      authorizedFetch<{
        loans: Loan[];
        repayments: LoanRepayment[];
        people: LoanPerson[];
      }>("/api/loans"),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: loansKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
      queryClient.invalidateQueries({ queryKey: ["household-insights"] }),
    ]);

  const [showForm, setShowForm] = useState(false);
  const [borrower, setBorrower] = useState("");
  const [principal, setPrincipal] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [lentDate, setLentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const peopleNames = useMemo(
    () => (data?.people ?? []).map((person) => person.name),
    [data?.people]
  );

  const addLoan = useMutation({
    mutationFn: () => {
      const parsedPrincipal = parseDecimalInput(principal);
      if (
        typeof parsedPrincipal !== "number" ||
        !Number.isFinite(parsedPrincipal) ||
        parsedPrincipal <= 0
      ) {
        throw new Error(t("Invalid amount", "Importe inválido"));
      }
      const name = borrower.trim();
      return authorizedFetch("/api/loans", {
        method: "POST",
        body: JSON.stringify({
          borrower_name: name,
          principal: parsedPrincipal,
          currency,
          lent_date: lentDate,
          movement_description: t(`Loan to ${name}`, `Préstamo a ${name}`),
          create_movement: true,
        }),
      });
    },
    onSuccess: async () => {
      await invalidate();
      setShowForm(false);
      setBorrower("");
      setPrincipal("");
      setLentDate(new Date().toISOString().slice(0, 10));
      toast.success(
        t(
          "Loan added — also recorded as an expense",
          "Préstamo añadido — también registrado como gasto"
        )
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not add the loan", "No se pudo añadir el préstamo")
      ),
  });

  const activeLoans =
    data?.loans.filter((loan) => loan.is_active) ?? data?.loans ?? [];
  const closedLoans = data?.loans.filter((loan) => !loan.is_active) ?? [];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("Loans lent", "Préstamos concedidos")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "Money you lent to people. Creating a loan records a Loan expense; repayments record income and reduce what you’re owed. You can also record a repayment from Movements → Income → Loan.",
            "Dinero que prestaste. Crear un préstamo registra un gasto Préstamo; los cobros registran ingreso y reducen lo que te deben. También puedes registrar un cobro en Movimientos → Ingreso → Préstamo."
          )}
        </p>

        {isError ? (
          <p className="text-sm text-destructive">
            {t(
              "Loans need the 2026-07-22-loans-receivables migration.",
              "Los préstamos requieren la migración 2026-07-22-loans-receivables."
            )}
          </p>
        ) : isPending ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : data && data.loans.length === 0 && !showForm ? (
          <EmptyState
            icon={Banknote}
            title={t("No loans out", "Sin préstamos pendientes")}
            description={t(
              "When you lend money, track it here and in Movements.",
              "Cuando prestes dinero, síguelo aquí y en Movimientos."
            )}
          />
        ) : (
          <ul className="space-y-3">
            {activeLoans.map((loan) => (
              <LoanRow
                key={loan.id}
                loan={loan}
                repayments={
                  data?.repayments.filter(
                    (repayment) => repayment.loan_id === loan.id
                  ) ?? []
                }
                onChanged={invalidate}
              />
            ))}
            {closedLoans.length > 0 && (
              <li className="pt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("Fully repaid", "Totalmente cobrados")}
                </p>
                <ul className="space-y-3">
                  {closedLoans.map((loan) => (
                    <LoanRow
                      key={loan.id}
                      loan={loan}
                      repayments={
                        data?.repayments.filter(
                          (repayment) => repayment.loan_id === loan.id
                        ) ?? []
                      }
                      onChanged={invalidate}
                    />
                  ))}
                </ul>
              </li>
            )}
          </ul>
        )}

        {showForm ? (
          <div className="space-y-3 rounded-lg bg-secondary/40 p-3 ring-1 ring-border">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loan-borrower">
                  {t("Borrower", "Persona")}
                </Label>
                <Input
                  id="loan-borrower"
                  list="loan-people-options"
                  value={borrower}
                  onChange={(event) => setBorrower(event.target.value)}
                  placeholder={t("e.g. Ana", "p. ej. Ana")}
                />
                <datalist id="loan-people-options">
                  {peopleNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-principal">
                  {t("Amount lent", "Importe prestado")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="loan-principal"
                    inputMode="decimal"
                    value={principal}
                    onChange={(event) => setPrincipal(event.target.value)}
                    className="font-mono tabular-nums"
                  />
                  <Select
                    value={currency}
                    onValueChange={(v) =>
                      v && setCurrency(v as typeof currency)
                    }
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
                <Label htmlFor="loan-date">{t("Date", "Fecha")}</Label>
                <Input
                  id="loan-date"
                  type="date"
                  value={lentDate}
                  onChange={(event) => setLentDate(event.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addLoan.mutate()}
                disabled={
                  addLoan.isPending || !borrower.trim() || !principal.trim()
                }
              >
                {addLoan.isPending && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {t("Add loan", "Añadir préstamo")}
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              <Plus />
              {t("Add loan", "Añadir préstamo")}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}

function LoanRow({
  loan,
  repayments,
  onChanged,
}: {
  loan: Loan;
  repayments: LoanRepayment[];
  onChanged: () => Promise<unknown>;
}) {
  const { t, locale } = useLocale();
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentDate, setRepaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [busy, setBusy] = useState(false);

  const repaidTotal = repayments.reduce(
    (sum, repayment) => sum + Number(repayment.amount),
    0
  );
  const outstanding = Math.max(Number(loan.principal) - repaidTotal, 0);

  const sortedRepayments = useMemo(
    () =>
      [...repayments].sort((a, b) =>
        a.repayment_date < b.repayment_date
          ? 1
          : a.repayment_date > b.repayment_date
            ? -1
            : 0
      ),
    [repayments]
  );

  const lastPaidDate = sortedRepayments[0]?.repayment_date ?? null;

  async function addRepayment() {
    const parsed = parseDecimalInput(repaymentAmount);
    if (
      typeof parsed !== "number" ||
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      toast.error(t("Invalid amount", "Importe inválido"));
      return;
    }
    setBusy(true);
    try {
      await authorizedFetch(`/api/loans/${loan.id}/repayments`, {
        method: "POST",
        body: JSON.stringify({
          repayment_date: repaymentDate,
          amount: parsed,
          currency: loan.currency,
          income_source: t(
            `Loan repayment — ${loan.borrower_name}`,
            `Cobro de préstamo — ${loan.borrower_name}`
          ),
          create_movement: true,
        }),
      });
      setRepaymentAmount("");
      await onChanged();
      toast.success(
        t("Repayment recorded as income", "Cobro registrado como ingreso")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not record repayment", "No se pudo registrar el cobro")
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeLoan() {
    if (
      !window.confirm(
        t(
          `Delete loan to "${loan.borrower_name}"? Movements already recorded stay in the ledger.`,
          `¿Eliminar el préstamo a "${loan.borrower_name}"? Los movimientos ya registrados se quedan en el libro.`
        )
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await authorizedFetch(`/api/loans/${loan.id}`, { method: "DELETE" });
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
          <p className="truncate text-sm font-medium">{loan.borrower_name}</p>
          <p className="text-xs text-muted-foreground">
            {t("Lent", "Prestado")}: {formatLoanDate(loan.lent_date, locale)}
            {` · ${formatCurrency(Number(loan.principal), loan.currency)}`}
            {!loan.is_active && ` · ${t("closed", "cerrado")}`}
          </p>
          {lastPaidDate && (
            <p className="text-xs text-muted-foreground">
              {loan.is_active
                ? t("Last paid", "Último cobro")
                : t("Paid off", "Saldado")}
              : {formatLoanDate(lastPaidDate, locale)}
            </p>
          )}
        </div>
        <span className="font-mono text-sm tabular-nums">
          {formatCurrency(outstanding, loan.currency)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={removeLoan}
          disabled={busy}
          aria-label={t("Delete loan", "Eliminar préstamo")}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {sortedRepayments.length > 0 && (
        <ul className="space-y-1 rounded-md bg-secondary/40 px-2.5 py-2">
          <li className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("Payments", "Cobros")}
          </li>
          {sortedRepayments.map((repayment) => (
            <li
              key={repayment.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-muted-foreground">
                {formatLoanDate(repayment.repayment_date, locale)}
              </span>
              <span className="font-mono tabular-nums text-positive">
                {formatCurrency(Number(repayment.amount), repayment.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {loan.is_active && outstanding > 0 && (
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            aria-label={t("Payment date", "Fecha del cobro")}
            value={repaymentDate}
            onChange={(event) => setRepaymentDate(event.target.value)}
            className="h-8 w-[150px] text-sm"
          />
          <Input
            inputMode="decimal"
            placeholder={t("Repayment amount", "Importe del cobro")}
            value={repaymentAmount}
            onChange={(event) => setRepaymentAmount(event.target.value)}
            className="h-8 max-w-[180px] font-mono text-sm tabular-nums"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addRepayment}
            disabled={busy || !repaymentAmount.trim()}
          >
            {t("Record repayment", "Registrar cobro")}
          </Button>
        </div>
      )}
    </li>
  );
}
