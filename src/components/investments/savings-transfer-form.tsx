"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentSavingsTransferSchema,
  type InvestmentSavingsTransferFormValues,
} from "@/lib/validations";
import {
  buildSavingsAccountLabel,
  type InvestmentSavingsAccountRow,
} from "@/lib/investments";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocale } from "@/providers/locale-provider";

interface SavingsTransferFormProps {
  accounts: InvestmentSavingsAccountRow[];
  onSubmit: (values: InvestmentSavingsTransferFormValues) => Promise<unknown>;
  defaultValues?: Partial<InvestmentSavingsTransferFormValues>;
  trigger?: React.ReactNode;
  title?: {
    create: string;
    edit: string;
  };
  helperText?: {
    en: string;
    es: string;
  };
  sourceKind?: "manual" | "expense_flow";
}

function getDefaults(
  accounts: InvestmentSavingsAccountRow[],
  values?: Partial<InvestmentSavingsTransferFormValues>,
  sourceKind?: "manual" | "expense_flow"
): InvestmentSavingsTransferFormValues {
  const firstAccount = accounts[0];
  const account =
    accounts.find((item) => item.id === values?.savings_account_id) ?? firstAccount;

  return {
    savings_account_id: values?.savings_account_id ?? account?.id ?? "",
    transfer_date: values?.transfer_date ?? format(new Date(), "yyyy-MM-dd"),
    amount: values?.amount ?? (undefined as unknown as number),
    currency: values?.currency ?? account?.currency ?? "EUR",
    notes: values?.notes ?? "",
    source_kind: values?.source_kind ?? sourceKind ?? "manual",
  };
}

export function SavingsTransferForm({
  accounts,
  onSubmit,
  defaultValues,
  trigger,
  title,
  helperText,
  sourceKind,
}: SavingsTransferFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestmentSavingsTransferFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentSavingsTransferSchema) as any,
    defaultValues: getDefaults(accounts, defaultValues, sourceKind),
  });

  const selectedAccountId = form.watch("savings_account_id");
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaults(accounts, defaultValues, sourceKind));
  }, [accounts, defaultValues, form, open, sourceKind]);

  useEffect(() => {
    if (!selectedAccount) return;
    if (!form.getFieldState("currency").isDirty) {
      form.setValue("currency", selectedAccount.currency, {
        shouldValidate: true,
      });
    }
  }, [form, selectedAccount]);

  async function handleSubmit(values: InvestmentSavingsTransferFormValues) {
    setSubmitting(true);
    const error = await onSubmit({
      ...values,
      source_kind: sourceKind ?? values.source_kind,
    });
    setSubmitting(false);

    if (!error) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={<Button size="sm" className="gap-1.5" disabled={accounts.length === 0} />}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">{t("Add investment movement", "Agregar movimiento de inversion")}</span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues
              ? title?.edit ?? t("Edit investment movement", "Editar movimiento de inversion")
              : title?.create ?? t("Add investment movement", "Agregar movimiento de inversion")}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {helperText?.en && helperText?.es
              ? t(helperText.en, helperText.es)
              : t(
                  "Move funds from your main balance to a configured savings account.",
                  "Mueve fondos desde tu balance principal hacia una cuenta de ahorro configurada."
                )}
          </p>
        </DialogHeader>

        {accounts.length === 0 ? (
          <div className="rounded-[1.1rem] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
            {t(
              "Create a savings account first in Investments before registering transfer movements.",
              "Crea primero una cuenta de ahorro en Inversiones para registrar transferencias."
            )}
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="savings-transfer-account">
                {t("Destination account", "Cuenta destino")}
              </Label>
              <Select
                value={selectedAccountId}
                onValueChange={(value) =>
                  value &&
                  form.setValue("savings_account_id", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="savings-transfer-account" className="h-11">
                  <SelectValue placeholder={t("Select account", "Selecciona cuenta")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {buildSavingsAccountLabel({
                        bankName: account.bank_name,
                        productName: account.product_name,
                        accountName: account.account_name,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="savings-transfer-date">{t("Date", "Fecha")}</Label>
                <Input
                  id="savings-transfer-date"
                  type="date"
                  className="h-11"
                  {...form.register("transfer_date")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="savings-transfer-currency">
                  {t("Currency", "Moneda")}
                </Label>
                <Select
                  value={form.watch("currency")}
                  onValueChange={(value) =>
                    value &&
                    form.setValue("currency", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="savings-transfer-currency" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.flag} {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-transfer-amount">{t("Amount", "Monto")}</Label>
              <Input
                id="savings-transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="h-11 font-mono"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-transfer-notes">
                {t("Description", "Descripcion")}
              </Label>
              <Input
                id="savings-transfer-notes"
                className="h-11"
                placeholder={t(
                  "Emergency fund top-up, monthly reserve...",
                  "Recarga fondo de emergencia, reserva mensual..."
                )}
                {...form.register("notes")}
              />
            </div>

            <div className="rounded-[1.1rem] border border-border/70 bg-secondary/35 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                {selectedAccount
                  ? buildSavingsAccountLabel({
                      bankName: selectedAccount.bank_name,
                      productName: selectedAccount.product_name,
                      accountName: selectedAccount.account_name,
                    })
                  : t("Select destination account", "Selecciona cuenta destino")}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {defaultValues
                  ? t("Save movement", "Guardar movimiento")
                  : t("Create movement", "Crear movimiento")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
