"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ContinuousSheet,
  SheetSection,
} from "@/components/patterns/continuous-sheet";
import { SectionHeader } from "@/components/patterns/section-header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { sumLoansOutstandingBase } from "@/lib/wealth/net-worth";
import { WealthCategoryHero } from "@/components/wealth/wealth-category-hero";
import {
  LoanWizard,
  type LoanWizardValues,
} from "@/components/wealth/wizards/loan-wizard";
import { Banknote, HandCoins, Plus, Trash2 } from "lucide-react";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];
type LoanPerson = Database["public"]["Tables"]["loan_people"]["Row"];

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
  const { baseCurrency, convert } = useCurrency();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: () =>
      authorizedFetch<{
        loans: Loan[];
        repayments: LoanRepayment[];
        people: LoanPerson[];
      }>("/api/loans"),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.loans }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.monthSnapshotAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.householdInsights }),
    ]);

  const [wizardOpen, setWizardOpen] = useState(false);

  const addLoan = useMutation({
    mutationFn: (values: LoanWizardValues) =>
      authorizedFetch("/api/loans", {
        method: "POST",
        body: JSON.stringify({
          borrower_name: values.borrower_name,
          principal: values.principal,
          currency: values.currency,
          lent_date: values.lent_date,
          notes: values.notes,
          movement_description: t(
            `Loan to ${values.borrower_name}`,
            `Préstamo a ${values.borrower_name}`
          ),
          // Only a loan made *now* books an expense. An existing receivable is
          // an opening snapshot — writing a movement would invent spending on
          // a date that has already passed.
          create_movement: values.create_movement,
        }),
      }),
    onSuccess: async (_data, values) => {
      await invalidate();
      toast.success(
        values.create_movement
          ? t(
              "Loan added — also recorded as an expense",
              "Préstamo añadido — también registrado como gasto"
            )
          : t("Loan recorded", "Préstamo registrado")
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not add the loan", "No se pudo añadir el préstamo")
      ),
  });

  const peopleNames = useMemo(
    () => (data?.people ?? []).map((person) => person.name),
    [data?.people]
  );

  const activeLoans =
    data?.loans.filter((loan) => loan.is_active) ?? data?.loans ?? [];
  const closedLoans = data?.loans.filter((loan) => !loan.is_active) ?? [];

  /**
   * Outstanding uses the shared balance-sheet reducer so this page and the
   * Patrimonio hero can never disagree about what is still owed to you.
   */
  const outstandingBase = useMemo(
    () =>
      data ? sumLoansOutstandingBase(data.loans, data.repayments, convert) : 0,
    [data, convert]
  );

  const lentBase = useMemo(
    () =>
      (data?.loans ?? []).reduce(
        (sum, loan) => sum + convert(Number(loan.principal), loan.currency),
        0
      ),
    [data?.loans, convert]
  );

  const recoveredBase = useMemo(
    () =>
      (data?.repayments ?? []).reduce(
        (sum, repayment) =>
          sum + convert(Number(repayment.amount), repayment.currency),
        0
      ),
    [data?.repayments, convert]
  );

  return (
    <>
      <div className="-mx-4 bg-ink sm:-mx-5 md:mx-0 md:overflow-hidden md:rounded-xl">
        <WealthCategoryHero
          eyebrow={t("Still to collect", "Pendiente por cobrar")}
          amount={outstandingBase}
          icon={HandCoins}
          className="mx-0 rounded-none sm:mx-0 md:mx-0 md:rounded-none"
          progress={
            lentBase > 0
              ? {
                  ratio: recoveredBase / lentBase,
                  label: t("Recovered", "Recuperado"),
                }
              : null
          }
          stats={[
            {
              label: t("Total lent", "Total prestado"),
              value: formatCurrency(lentBase, baseCurrency),
            },
            {
              label: t("Recovered", "Recuperado"),
              value: formatCurrency(recoveredBase, baseCurrency),
              tone: "positive",
            },
            {
              label: t("Active", "Activos"),
              value: String(activeLoans.length),
            },
          ]}
        />

        <ContinuousSheet className="relative -mt-px mx-0 rounded-none ring-0 sm:mx-0 md:mx-0 md:rounded-none md:ring-0">
          <SheetSection
            header={
              <SectionHeader
                title={t("Loans lent", "Préstamos concedidos")}
              />
            }
            className="space-y-4"
          >
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
            ) : data && data.loans.length === 0 ? (
              <EmptyState
                icon={Banknote}
                title={t("No loans out", "Sin préstamos pendientes")}
                description={t(
                  "When you lend money, track it here and in Movements.",
                  "Cuando prestes dinero, síguelo aquí y en Movimientos."
                )}
              />
            ) : (
              <ul className="divide-y divide-border/70">
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
                  <li className="pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("Fully repaid", "Totalmente cobrados")}
                    </p>
                    <ul className="divide-y divide-border/70">
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

            {!isError && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWizardOpen(true)}
              >
                <Plus />
                {t("Add loan", "Añadir préstamo")}
              </Button>
            )}
          </SheetSection>
        </ContinuousSheet>
      </div>

      <LoanWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        people={peopleNames}
        onSubmit={(values) => addLoan.mutateAsync(values)}
      />
    </>
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
          <Link
            href={`/wealth/loans/${loan.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {loan.borrower_name}
          </Link>
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
          <li className="label-caps">
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
