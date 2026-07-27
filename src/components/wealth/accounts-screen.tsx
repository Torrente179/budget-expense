"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import {
  HeroSheen,
  HERO_ACCENT,
  HERO_RULE,
  HERO_SURFACE,
} from "@/components/patterns/hero-surface";
import { StatusTag } from "@/components/patterns/status-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import {
  AccountWizard,
  type AccountWizardValues,
} from "@/components/wealth/wizards/account-wizard";
import { useWealthAccounts } from "@/hooks/use-wealth-accounts";
import { PALETTE } from "@/lib/palette";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

const KINDS = [
  { value: "checking", en: "Current account", es: "Cuenta corriente" },
  { value: "savings", en: "Savings account", es: "Cuenta de ahorro" },
  { value: "cash", en: "Cash", es: "Efectivo" },
  { value: "digital_wallet", en: "Digital wallet", es: "Monedero digital" },
  { value: "other", en: "Other account", es: "Otra cuenta" },
] as const;

/**
 * Cuentas y efectivo.
 *
 * The opening balance is a starting snapshot, never income for the current
 * month — the form says so explicitly, because mistaking one for the other is
 * the single easiest way to corrupt a month's cashflow.
 */
export function AccountsScreen() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const {
    activeAccounts,
    totalBase,
    availableBase,
    loading,
    createAccount,
    setPrimaryAccount,
  } = useWealthAccounts();

  const [wizardOpen, setWizardOpen] = useState(false);

  async function handleCreate(values: AccountWizardValues) {
    try {
      await createAccount.mutateAsync(values);
      toast.success(t("Account added", "Cuenta añadida"));
    } catch {
      toast.error(t("Could not add the account", "No se pudo añadir la cuenta"));
      throw new Error("create failed");
    }
  }

  return (
    <Screen
      title={t("Accounts & cash", "Cuentas y efectivo")}
      backHref="/wealth"
      subheader={
        <WealthBreadcrumb current={t("Accounts", "Cuentas")} />
      }
      actions={
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("Add account", "Añadir cuenta")}
        </Button>
      }
    >
      {loading ? (
        <>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-xl" />
        </>
      ) : (
        <>
          <section className={cn(HERO_SURFACE, "px-5 py-5 sm:px-6")}>
            <HeroSheen />
            <div className="relative space-y-4">
              <div className="space-y-1.5">
                <p className="label-caps text-white/55">
                  {t("Total liquid", "Total líquido")}
                </p>
                <p className="font-mono text-display tabular-nums tracking-tight text-white">
                  {formatCurrency(totalBase, baseCurrency)}
                </p>
              </div>
              <div className={cn("grid grid-cols-2 gap-4 border-t pt-4", HERO_RULE)}>
                <div className="min-w-0">
                  <p className="label-caps text-white/55">
                    {t("Spendable", "Disponible")}
                  </p>
                  <p
                    className="mt-1 truncate font-mono text-heading font-semibold tabular-nums"
                    style={{ color: HERO_ACCENT }}
                  >
                    {formatCurrency(availableBase, baseCurrency)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="label-caps text-white/55">
                    {t("Accounts", "Cuentas")}
                  </p>
                  <p className="mt-1 font-mono text-heading font-semibold tabular-nums text-white">
                    {activeAccounts.length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Card>
            <CardHeader>
              <SectionHeader title={t("Your accounts", "Tus cuentas")} />
            </CardHeader>
            <CardContent>
              {activeAccounts.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title={t("No accounts yet", "Aún no tienes cuentas")}
                  description={t(
                    "Add your current account or cash so your net worth reflects the money you actually hold.",
                    "Añade tu cuenta corriente o efectivo para que tu patrimonio refleje el dinero que realmente tienes."
                  )}
                >
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("Add your first account", "Añadir primera cuenta")}
                  </Button>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-border/60">
                  {activeAccounts.map((account) => {
                    const kindLabel = KINDS.find(
                      (option) => option.value === account.kind
                    );

                    return (
                      <li
                        key={account.id}
                        className="flex items-center gap-3 py-3.5"
                      >
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${PALETTE.wealth.accounts}1f`,
                            color: PALETTE.wealth.accounts,
                          }}
                        >
                          <Wallet className="h-[18px] w-[18px]" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-medium">
                            {account.name}
                          </p>
                          <p className="truncate text-caption text-muted-foreground">
                            {kindLabel
                              ? t(kindLabel.en, kindLabel.es)
                              : account.kind}
                            {account.institution
                              ? ` · ${account.institution}`
                              : ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-mono text-body font-medium tabular-nums">
                            {formatCurrency(
                              account.balance,
                              account.currency
                            )}
                          </p>
                          {account.is_primary ? (
                            <StatusTag tone="info" className="mt-0.5">
                              {t("Reconciled", "Conciliada")}
                            </StatusTag>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setPrimaryAccount.mutate(account.id)
                              }
                              className="mt-0.5 text-caption text-primary hover:underline"
                            >
                              {t("Make primary", "Hacer principal")}
                            </button>
                          )}
                          {!account.include_in_available && (
                            <StatusTag tone="neutral" className="mt-0.5">
                              {t("Not spendable", "No disponible")}
                            </StatusTag>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AccountWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={handleCreate}
      />
    </Screen>
  );
}
