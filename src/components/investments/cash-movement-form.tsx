"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentCashMovementSchema,
  type InvestmentCashMovementFormValues,
} from "@/lib/validations";
import {
  CUSTOM_BROKER_VALUE,
  buildBrokerChoices,
  normalizeBrokerName,
} from "@/lib/investments";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRightLeft, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocale } from "@/providers/locale-provider";

interface BrokerageAccountOption {
  id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_currency: string;
}

interface CashMovementFormProps {
  accounts: BrokerageAccountOption[];
  onSubmit: (values: InvestmentCashMovementFormValues) => Promise<unknown>;
  defaultValues?: Partial<InvestmentCashMovementFormValues>;
  trigger?: React.ReactNode;
}

function getDefaults(defaultValues?: Partial<InvestmentCashMovementFormValues>) {
  return {
    account_id: defaultValues?.account_id ?? "",
    broker_name: defaultValues?.broker_name ?? "",
    movement_type: defaultValues?.movement_type ?? "deposit",
    movement_date:
      defaultValues?.movement_date ?? format(new Date(), "yyyy-MM-dd"),
    amount: defaultValues?.amount ?? (undefined as unknown as number),
    currency: defaultValues?.currency ?? "USD",
    fee_amount: defaultValues?.fee_amount ?? 0,
    fee_currency: defaultValues?.fee_currency ?? "USD",
    notes: defaultValues?.notes ?? "",
  } satisfies InvestmentCashMovementFormValues;
}

export function CashMovementForm({
  accounts,
  onSubmit,
  defaultValues,
  trigger,
}: CashMovementFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestmentCashMovementFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentCashMovementSchema) as any,
    defaultValues: getDefaults(defaultValues),
  });

  const accountId = form.watch("account_id");
  const brokerName = form.watch("broker_name");
  const brokerChoices = buildBrokerChoices(accounts);
  const normalizedBrokerName = normalizeBrokerName(brokerName ?? "");
  const brokerSelectValue =
    brokerChoices.find(
      (choice) => choice.toLowerCase() === normalizedBrokerName.toLowerCase()
    ) ??
    (normalizedBrokerName.length > 0 ? CUSTOM_BROKER_VALUE : "");
  const selectedAccount =
    accounts.find((account) => account.id === accountId) ??
    accounts.find(
      (account) =>
        normalizeBrokerName(account.broker_kind).toLowerCase() ===
        normalizedBrokerName.toLowerCase()
    );

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaults(defaultValues));
  }, [defaultValues, form, open]);

  useEffect(() => {
    if (!selectedAccount) return;
    if (!form.getFieldState("currency").isDirty) {
      form.setValue("currency", selectedAccount.account_currency, {
        shouldValidate: true,
      });
    }
    if (!form.getFieldState("fee_currency").isDirty) {
      form.setValue("fee_currency", selectedAccount.fee_currency, {
        shouldValidate: true,
      });
    }
  }, [form, selectedAccount]);

  async function handleSubmit(values: InvestmentCashMovementFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
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
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          {t("Add cash movement", "Agregar movimiento de caja")}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues
              ? t("Edit cash movement", "Editar movimiento de caja")
              : t("Add cash movement", "Agregar movimiento de caja")}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(
              "Record deposits and withdrawals without mixing them into the budget ledger.",
              "Registra depósitos y retiros sin mezclarlos con el registro de presupuesto."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="movement-broker">{t("Broker", "Broker")}</Label>
            <Select
              value={brokerSelectValue}
              onValueChange={(value) => {
                if (!value) return;

                if (value === CUSTOM_BROKER_VALUE) {
                  form.setValue("broker_name", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("account_id", "", {
                    shouldDirty: true,
                  });
                  return;
                }

                const matchedAccount = accounts.find(
                  (account) =>
                    normalizeBrokerName(account.broker_kind).toLowerCase() ===
                    value.toLowerCase()
                );

                form.setValue("broker_name", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.setValue("account_id", matchedAccount?.id ?? "", {
                  shouldDirty: true,
                });
              }}
            >
              <SelectTrigger id="movement-broker" className="h-11">
                <SelectValue placeholder={t("Select a broker", "Selecciona un broker")} />
              </SelectTrigger>
              <SelectContent>
                {brokerChoices.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_BROKER_VALUE}>
                  {t("Other broker", "Otro broker")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {brokerSelectValue === CUSTOM_BROKER_VALUE && (
            <div className="space-y-2">
              <Label htmlFor="movement-custom-broker">
                {t("Custom broker", "Broker personalizado")}
              </Label>
              <Input
                id="movement-custom-broker"
                placeholder={t(
                  "Trii, Webull, local bank broker...",
                  "Trii, Webull, broker bancario local..."
                )}
                className="h-11"
                {...form.register("broker_name")}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-type">{t("Type", "Tipo")}</Label>
              <Select
                value={form.watch("movement_type")}
                onValueChange={(value) =>
                  value &&
                  form.setValue(
                    "movement_type",
                    value as "deposit" | "withdrawal",
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
                >
                  <SelectTrigger id="movement-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">
                      {t("Deposit", "Depósito")}
                    </SelectItem>
                    <SelectItem value="withdrawal">
                      {t("Withdrawal", "Retiro")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement-date">{t("Date", "Fecha")}</Label>
                <Input
                  id="movement-date"
                type="date"
                className="h-11"
                {...form.register("movement_date")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-amount">{t("Amount", "Monto")}</Label>
              <Input
                id="movement-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="h-11 font-mono"
                {...form.register("amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement-currency">{t("Currency", "Moneda")}</Label>
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
                <SelectTrigger id="movement-currency" className="h-11">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-fee">{t("Fee amount", "Monto de comisión")}</Label>
              <Input
                id="movement-fee"
                type="number"
                step="0.01"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement-fee-currency">
                {t("Fee currency", "Moneda de comisión")}
              </Label>
              <Select
                value={form.watch("fee_currency")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("fee_currency", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="movement-fee-currency" className="h-11">
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
            <Label htmlFor="movement-notes">{t("Notes", "Notas")}</Label>
            <Input
              id="movement-notes"
              placeholder={t(
                "Wire transfer, local bank withdrawal...",
                "Transferencia bancaria, retiro local..."
              )}
              className="h-11"
              {...form.register("notes")}
            />
          </div>

          <div className="rounded-[1.3rem] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="h-4 w-4" />
              {t(
                "Cash movements stay inside the investment ledger.",
                "Los movimientos de caja permanecen dentro del registro de inversiones."
              )}
            </div>
            <p className="mt-2 leading-6">
              {t(
                "Deposits and withdrawals affect account cash and contribution tracking, but they do not change your expense budget.",
                "Los depósitos y retiros afectan la caja y el seguimiento de aportes, pero no cambian tu presupuesto de gastos."
              )}
            </p>
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
      </DialogContent>
    </Dialog>
  );
}
