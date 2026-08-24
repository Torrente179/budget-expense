"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import {
  buildSavingsAccountLabel,
  type InvestmentSavingsAccountRow,
  type InvestmentSavingsTransferWithJoins,
  type SavingsProductType,
} from "@/lib/investments";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import { Screen } from "@/components/patterns/screen";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import { WealthCategoryHero } from "@/components/wealth/wealth-category-hero";
import {
  SavingsWizard,
  type SavingsWizardValues,
} from "@/components/wealth/wizards/savings-wizard";
import { SavingsTransferTable } from "@/components/wealth/savings-transfer-table";
import {
  ContinuousSheet,
  SheetSection,
} from "@/components/patterns/continuous-sheet";
import { SectionHeader } from "@/components/patterns/section-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";

const SavingsAccountForm = dynamic(() =>
  import("@/components/wealth/savings-account-form").then(
    (module) => module.SavingsAccountForm
  )
);
const SavingsTransferForm = dynamic(() =>
  import("@/components/wealth/savings-transfer-form").then(
    (module) => module.SavingsTransferForm
  )
);

export default function InvestmentSavingsPage() {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const [accountFormMounted, setAccountFormMounted] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<InvestmentSavingsAccountRow | null>(null);
  const [transferFormMounted, setTransferFormMounted] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] =
    useState<InvestmentSavingsTransferWithJoins | null>(null);
  const {
    savingsAccounts,
    savingsTransfers,
    savingsAccountSummaries,
    totalSavingsBalance,
    loading,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    addSavingsTransfer,
    updateSavingsTransfer,
    deleteSavingsTransfer,
    hasMoreSavings,
    loadMoreSavings,
    loadingMoreSavings,
  } = useInvestments({
    includeTrades: false,
    includeCash: false,
    includeSavings: true,
    includeWatchlist: false,
  });

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  /**
   * The wizard speaks in plain terms (name, where it is held, balance); the
   * table underneath needs a bank/product shape. Map once, here, so the wizard
   * never has to know about `country_code` or `product_type`.
   */
  async function handleCreateFund(values: SavingsWizardValues) {
    const created = await addSavingsAccount({
      country_code: values.currency === "COP" ? "CO" : "ES",
      bank_code: values.bank.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) || "other",
      bank_name: values.bank,
      product_type: "savings_account",
      product_name: values.name,
      account_name: values.name,
      currency: values.currency,
      target_amount: values.target,
      include_in_available: values.includeInAvailable,
    });

    // runMutation resolves to an Error rather than throwing, so a failed
    // create must not be followed by an orphan movement.
    if (created instanceof Error) return;

    // An opening balance is recorded as the fund's first movement, so the
    // balance and its history agree from the start.
    if (values.balance > 0 && created?.id) {
      await addSavingsTransfer({
        savings_account_id: created.id,
        transfer_date: new Date().toISOString().slice(0, 10),
        amount: values.balance,
        direction: "deposit",
        currency: values.currency,
        notes: t("Opening balance", "Saldo inicial"),
        source_kind: "manual",
      });
    }
  }

  /** Net movement this month — deposits minus withdrawals, in base currency. */
  const movedThisMonth = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return savingsTransfers
      .filter((transfer) => transfer.transfer_date.startsWith(prefix))
      .reduce(
        (sum, transfer) =>
          sum + convert(Number(transfer.amount), transfer.currency),
        0
      );
  }, [savingsTransfers, convert]);

  async function confirmDeleteSavingsAccount() {
    if (!pendingDeleteId) return;
    await deleteSavingsAccount(pendingDeleteId);
    setPendingDeleteId(null);
  }

  function openAccountForm(account: InvestmentSavingsAccountRow | null = null) {
    setEditingAccount(account);
    setAccountFormMounted(true);
    setAccountFormOpen(true);
  }

  function openTransferForm(
    transfer: InvestmentSavingsTransferWithJoins | null = null
  ) {
    setEditingTransfer(transfer);
    setTransferFormMounted(true);
    setTransferFormOpen(true);
  }

  return (
    <Screen
      title={t("Savings", "Ahorros")}
      backHref="/wealth"
      mode="chrome-sheet"
      actions={
        <>
          <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("Add account", "Agregar cuenta")}
            </span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={savingsAccounts.length === 0}
            onClick={() => openTransferForm()}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("Add movement", "Agregar movimiento")}
            </span>
          </Button>
        </>
      }
      subheader={<WealthBreadcrumb current={t("Savings", "Ahorros")} />}
    >

      <div className="-mx-4 bg-ink sm:-mx-5 md:mx-0 md:overflow-hidden md:rounded-xl">
        <WealthCategoryHero
          eyebrow={t("Total saved", "Total ahorrado")}
          amount={totalSavingsBalance}
          icon={PiggyBank}
          className="mx-0 rounded-none sm:mx-0 md:mx-0 md:rounded-none"
          delta={
            movedThisMonth !== 0
              ? { amount: movedThisMonth, label: t("this month", "este mes") }
              : null
          }
          stats={[
            {
              label: t("Funds", "Fondos"),
              value: String(savingsAccounts.length),
            },
            {
              label: t("Movements", "Movimientos"),
              value: String(savingsTransfers.length),
            },
            {
              label: t("Currencies", "Monedas"),
              value: String(
                new Set(savingsAccounts.map((account) => account.currency)).size
              ),
            },
          ]}
        />

        <ContinuousSheet className="relative -mt-px mx-0 rounded-none ring-0 sm:mx-0 md:mx-0 md:rounded-none md:ring-0">
          <SheetSection
            header={
              <SectionHeader
                eyebrow={t("Activity", "Actividad")}
                title={t("Savings movements", "Movimientos de ahorro")}
              />
            }
          >
            <SavingsTransferTable
              transfers={savingsTransfers}
              loading={loading}
              onEdit={openTransferForm}
              onDelete={deleteSavingsTransfer}
            />

            {hasMoreSavings ? (
              <Button
                variant="outline"
                className="mx-auto mt-4 flex"
                disabled={loadingMoreSavings}
                onClick={() => void loadMoreSavings()}
              >
                {loadingMoreSavings
                  ? t("Loading…", "Cargando…")
                  : t("Load more movements", "Cargar más movimientos")}
              </Button>
            ) : null}
          </SheetSection>

          <SheetSection
            header={
              <SectionHeader
                title={t("Savings accounts", "Cuentas de ahorro")}
              />
            }
          >
            {savingsAccountSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Add your first savings account in Colombia or Spain and start tracking transfers.",
                  "Agrega tu primera cuenta de ahorro en Colombia o España y comienza a rastrear transferencias."
                )}
              </p>
            ) : (
              <div className="divide-y divide-border/70">
                {savingsAccountSummaries.map((account) => (
                <div key={account.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {buildSavingsAccountLabel({
                          bankName: account.bank_name,
                          productName: account.product_name,
                          accountName: account.account_name,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.country_code} · {account.currency}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAccountForm(account)}
                      >
                        {t("Edit", "Editar")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDeleteId(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("Tracked balance", "Saldo rastreado")}: {" "}
                    {formatCurrency(account.balance, baseCurrency)}
                  </p>
                </div>
                ))}
              </div>
            )}
          </SheetSection>
        </ContinuousSheet>
      </div>

      {accountFormMounted ? (
        <SavingsAccountForm
          key={editingAccount?.id ?? "new"}
          defaultValues={
            editingAccount
              ? {
                  country_code: editingAccount.country_code as "CO" | "ES",
                  bank_code: editingAccount.bank_code,
                  bank_name: editingAccount.bank_name,
                  product_type: editingAccount.product_type as SavingsProductType,
                  product_name: editingAccount.product_name,
                  account_name: editingAccount.account_name,
                  currency: editingAccount.currency,
                }
              : undefined
          }
          onSubmit={(values) =>
            editingAccount
              ? updateSavingsAccount(editingAccount.id, values)
              : addSavingsAccount(values)
          }
          controlledOpen={accountFormOpen}
          onOpenChange={(open) => {
            setAccountFormOpen(open);
            if (!open) setEditingAccount(null);
          }}
        />
      ) : null}

      {transferFormMounted ? (
        <SavingsTransferForm
          key={editingTransfer?.id ?? "new"}
          accounts={savingsAccounts}
          defaultValues={
            editingTransfer
              ? {
                  savings_account_id: editingTransfer.savings_account_id,
                  transfer_date: editingTransfer.transfer_date,
                  // Stored signed; the form edits a positive amount + direction.
                  amount: Math.abs(Number(editingTransfer.amount)),
                  direction:
                    Number(editingTransfer.amount) < 0
                      ? ("withdrawal" as const)
                      : ("deposit" as const),
                  currency: editingTransfer.currency,
                  notes: editingTransfer.notes ?? "",
                  source_kind: editingTransfer.source_kind as
                    | "manual"
                    | "expense_flow",
                }
              : undefined
          }
          onSubmit={(values) =>
            editingTransfer
              ? updateSavingsTransfer(editingTransfer.id, values)
              : addSavingsTransfer(values)
          }
          controlledOpen={transferFormOpen}
          onOpenChange={(open) => {
            setTransferFormOpen(open);
            if (!open) setEditingTransfer(null);
          }}
        />
      ) : null}
      <SavingsWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={handleCreateFund}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        destructive
        title={t("Delete this fund?", "¿Eliminar este fondo?")}
        description={t(
          "Its movements go with it, and past net worth will change. Consider keeping it at zero instead.",
          "Sus movimientos se eliminan con él y tu patrimonio pasado cambiará. Considera dejarlo a cero en su lugar."
        )}
        confirmLabel={t("Delete", "Eliminar")}
        onConfirm={confirmDeleteSavingsAccount}
      />
    </Screen>
  );
}
