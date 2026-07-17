"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  brokerageAccountSchema,
  type BrokerageAccountFormValues,
} from "@/lib/validations";
import {
  CUSTOM_BROKER_VALUE,
  POPULAR_BROKERS,
  normalizeBrokerName,
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
import { Loader2, Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface BrokerageAccountFormProps {
  onSubmit: (values: BrokerageAccountFormValues) => Promise<unknown>;
  defaultValues?: Partial<BrokerageAccountFormValues>;
  trigger?: React.ReactNode;
}

export function BrokerageAccountForm({
  onSubmit,
  defaultValues,
  trigger,
}: BrokerageAccountFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BrokerageAccountFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(brokerageAccountSchema) as any,
    defaultValues: {
      broker_kind: defaultValues?.broker_kind ?? "Interactive Brokers",
      name:
        defaultValues?.name ??
        defaultValues?.broker_kind ??
        "Interactive Brokers",
      account_currency: defaultValues?.account_currency ?? "USD",
      fee_mode: defaultValues?.fee_mode ?? "manual",
      fee_percent: defaultValues?.fee_percent ?? 0,
      fee_fixed_amount: defaultValues?.fee_fixed_amount ?? 0,
      fee_min_amount: defaultValues?.fee_min_amount ?? 0,
      fee_currency: defaultValues?.fee_currency ?? "USD",
    },
  });

  async function handleSubmit(values: BrokerageAccountFormValues) {
    const normalizedBroker = normalizeBrokerName(values.broker_kind);
    setSubmitting(true);
    const error = await onSubmit({
      ...values,
      broker_kind: normalizedBroker,
      name: values.name.trim() || normalizedBroker,
    });
    setSubmitting(false);

    if (!error) {
      setOpen(false);
    }
  }

  const brokerKind = form.watch("broker_kind");
  const brokerSelectValue = POPULAR_BROKERS.includes(
    brokerKind as (typeof POPULAR_BROKERS)[number]
  )
    ? brokerKind
    : CUSTOM_BROKER_VALUE;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">{t("Add broker", "Agregar broker")}</span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues
              ? t("Edit broker defaults", "Editar valores de broker")
              : t("Add broker defaults", "Agregar valores de broker")}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(
              "Save a broker entry, optional label, currency, and fee defaults that the trade forms can prefill later.",
              "Guarda un broker con etiqueta opcional, moneda y comisiones por defecto para autocompletar operaciones."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-broker-kind">{t("Broker", "Broker")}</Label>
              <Select
                value={brokerSelectValue}
                onValueChange={(value) => {
                  if (!value) return;

                  if (value === CUSTOM_BROKER_VALUE) {
                    form.setValue("broker_kind", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (!form.getValues("name")) {
                      form.setValue("name", "");
                    }
                    return;
                  }

                  form.setValue("broker_kind", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  if (!form.getFieldState("name").isDirty) {
                    form.setValue("name", value, {
                      shouldDirty: true,
                    });
                  }
                }}
              >
                <SelectTrigger id="account-broker-kind" className="h-11">
                  <SelectValue placeholder={t("Select a broker", "Selecciona un broker")} />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_BROKERS.map((broker) => (
                    <SelectItem key={broker} value={broker}>
                      {broker}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_BROKER_VALUE}>
                    {t("Other broker", "Otro broker")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">{t("Account name", "Nombre de cuenta")}</Label>
              <Input
                id="account-name"
                placeholder={t(
                  "Long-term account, Colombia book...",
                  "Cuenta largo plazo, cuenta Colombia..."
                )}
                className="h-11"
                {...form.register("name")}
              />
            </div>
          </div>

          {brokerSelectValue === CUSTOM_BROKER_VALUE && (
            <div className="space-y-2">
              <Label htmlFor="account-custom-broker">
                {t("Custom broker", "Broker personalizado")}
              </Label>
              <Input
                id="account-custom-broker"
                placeholder={t("Trii, Scotiabank, Webull...", "Trii, Scotiabank, Webull...")}
                className="h-11"
                {...form.register("broker_kind")}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-currency">
                {t("Account currency", "Moneda de la cuenta")}
              </Label>
              <Select
                value={form.watch("account_currency")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("account_currency", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="account-currency" className="h-11">
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

            <div className="space-y-2">
              <Label htmlFor="fee-mode">{t("Fee mode", "Modo de comisión")}</Label>
              <Select
                value={form.watch("fee_mode")}
                onValueChange={(value) =>
                  value &&
                  form.setValue(
                    "fee_mode",
                    value as
                      | "manual"
                      | "percent"
                      | "fixed"
                      | "percent_plus_fixed",
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
                >
                  <SelectTrigger id="fee-mode" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      {t("Manual only", "Solo manual")}
                    </SelectItem>
                    <SelectItem value="percent">{t("Percent", "Porcentaje")}</SelectItem>
                    <SelectItem value="fixed">{t("Fixed", "Fijo")}</SelectItem>
                    <SelectItem value="percent_plus_fixed">
                      {t("Percent + fixed", "Porcentaje + fijo")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fee-percent">
                {t("Fee percent", "Porcentaje de comisión")}
              </Label>
              <Input
                id="fee-percent"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_percent")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-fixed">{t("Fixed fee", "Comisión fija")}</Label>
              <Input
                id="fee-fixed"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_fixed_amount")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fee-min">{t("Minimum fee", "Comisión mínima")}</Label>
              <Input
                id="fee-min"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_min_amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-currency">
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
                <SelectTrigger id="fee-currency" className="h-11">
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues
                ? t("Save broker", "Guardar broker")
                : t("Create broker", "Crear broker")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
