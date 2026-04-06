"use client";

import { Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import {
  buildSavingsAccountLabel,
  type SavingsProductType,
} from "@/lib/investments";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { InvestmentsSectionNav } from "@/components/investments/investments-section-nav";
import { SavingsAccountForm } from "@/components/investments/savings-account-form";
import { SavingsTransferForm } from "@/components/investments/savings-transfer-form";
import { SavingsTransferTable } from "@/components/investments/savings-transfer-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";

export default function InvestmentSavingsPage() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
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
  } = useInvestments();

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

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("Investments · Savings", "Inversiones · Cuentas de ahorro")}
        description={
          loading
            ? t(
                "Track transfers from your main balance to each configured savings account.",
                "Rastrea transferencias desde tu balance principal hacia cada cuenta de ahorro configurada."
              )
            : t(
                `${savingsAccounts.length} account${savingsAccounts.length !== 1 ? "s" : ""} · ${savingsTransfers.length} movement${savingsTransfers.length !== 1 ? "s" : ""}`,
                `${savingsAccounts.length} cuenta${savingsAccounts.length !== 1 ? "s" : ""} · ${savingsTransfers.length} movimiento${savingsTransfers.length !== 1 ? "s" : ""}`
              )
        }
      >
        <SavingsAccountForm onSubmit={addSavingsAccount} />
        <SavingsTransferForm
          accounts={savingsAccounts}
          onSubmit={addSavingsTransfer}
        />
      </PageHeader>

      <InvestmentsSectionNav />

      <div>
        <Card className="border-border/80 bg-card/96">
          <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Savings balance", "Saldo de ahorros")}
              </p>
              <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {formatCurrency(totalSavingsBalance, baseCurrency)}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Accounts configured", "Cuentas configuradas")}
              </p>
              <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {savingsAccounts.length}
              </p>
            </div>
            <div className="hidden rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4 sm:block">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                {t("Movements", "Movimientos")}
              </p>
              <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                {savingsTransfers.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:grid xl:grid-cols-[minmax(0,1.2fr)_420px] xl:gap-5">
        <SavingsTransferTable
          transfers={savingsTransfers}
          accounts={savingsAccounts}
          loading={loading}
          onUpdate={updateSavingsTransfer}
          onDelete={deleteSavingsTransfer}
        />

        <Card className="hidden border-border/80 bg-card/96 xl:block">
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
                  className="rounded-[1.25rem] border border-border/70 bg-secondary/25 p-4"
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
                      <SavingsAccountForm
                        defaultValues={{
                          country_code: account.country_code as "CO" | "ES",
                          bank_code: account.bank_code,
                          bank_name: account.bank_name,
                          product_type: account.product_type as SavingsProductType,
                          product_name: account.product_name,
                          account_name: account.account_name,
                          currency: account.currency,
                        }}
                        onSubmit={(values) =>
                          updateSavingsAccount(account.id, values)
                        }
                        trigger={
                          <Button variant="ghost" size="sm">
                            {t("Edit", "Editar")}
                          </Button>
                        }
                      />
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

    </div>
  );
}
