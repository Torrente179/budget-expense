"use client";

import { useState } from "react";
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
import { Screen } from "@/components/patterns/screen";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { SavingsTransferTable } from "@/components/wealth/savings-transfer-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { baseCurrency } = useCurrency();
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

  async function handleDeleteSavingsAccount(id: string) {
    if (
      !window.confirm(
        t(
          "Delete this savings account and all linked transfers?",
          "¿Eliminar esta cuenta de ahorro y todas las transferencias vinculadas?"
        )
      )
    ) {
      return;
    }

    await deleteSavingsAccount(id);
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
      actions={
        <>
          <Button size="sm" className="gap-1.5" onClick={() => openAccountForm()}>
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
      subheader={<WealthNav />}
    >

      <div>
        <Card className="bg-card">
          <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
              <p className="label-caps">
                {t("Savings balance", "Saldo de ahorros")}
              </p>
              <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                {formatCurrency(totalSavingsBalance, baseCurrency)}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
              <p className="label-caps">
                {t("Accounts configured", "Cuentas configuradas")}
              </p>
              <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                {savingsAccounts.length}
              </p>
            </div>
            <div className="hidden rounded-lg border border-border/70 bg-secondary/35 p-4 sm:block">
              <p className="label-caps">
                {t("Movements", "Movimientos")}
              </p>
              <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                {savingsTransfers.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:grid xl:grid-cols-[minmax(0,1.2fr)_420px] xl:gap-5">
        <div>
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
        </div>

        <Card className="hidden bg-card xl:block">
          <CardHeader className="border-b border-border/70">
            <CardTitle>{t("Savings accounts", "Cuentas de ahorro")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {savingsAccountSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Add your first savings account in Colombia or Spain and start tracking transfers.",
                  "Agrega tu primera cuenta de ahorro en Colombia o España y comienza a rastrear transferencias."
                )}
              </p>
            ) : (
              savingsAccountSummaries.map((account) => (
                <div
                  key={account.id}
                  className="rounded-lg border border-border/70 bg-secondary/25 p-4"
                >
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
                        onClick={() => void handleDeleteSavingsAccount(account.id)}
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
              ))
            )}
          </CardContent>
        </Card>
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
                  amount: Number(editingTransfer.amount),
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
    </Screen>
  );
}
