"use client";

import { Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import {
  buildSavingsAccountLabel,
  type SavingsProductType,
} from "@/lib/investments";
import { formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { SavingsAccountForm } from "@/components/wealth/savings-account-form";
import { SavingsTransferForm } from "@/components/wealth/savings-transfer-form";
import { SavingsTransferTable } from "@/components/wealth/savings-transfer-table";
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
    <Screen
      title={t("Savings", "Ahorros")}
      backHref="/wealth"
      actions={
        <>
          <SavingsAccountForm onSubmit={addSavingsAccount} />
          <SavingsTransferForm
            accounts={savingsAccounts}
            onSubmit={addSavingsTransfer}
          />
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
        <SavingsTransferTable
          transfers={savingsTransfers}
          accounts={savingsAccounts}
          loading={loading}
          onUpdate={updateSavingsTransfer}
          onDelete={deleteSavingsTransfer}
        />

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
    </Screen>
  );
}
