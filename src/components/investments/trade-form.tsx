"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentTradeSchema,
  type InvestmentTradeFormValues,
} from "@/lib/validations";
import {
  CUSTOM_BROKER_VALUE,
  buildBrokerChoices,
  estimateTradeFee,
  normalizeBrokerName,
  type MarketPriceResponse,
} from "@/lib/investments";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvestmentAssetFields } from "@/components/investments/investment-asset-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocale } from "@/providers/locale-provider";

interface BrokerageAccountOption {
  id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_mode: string;
  fee_percent: number;
  fee_fixed_amount: number;
  fee_min_amount: number;
  fee_currency: string;
}

interface TradeFormProps {
  accounts: BrokerageAccountOption[];
  onSubmit: (values: InvestmentTradeFormValues) => Promise<unknown>;
  lookupPrice: (params: {
    asset: InvestmentTradeFormValues["asset"];
    date?: string;
  }) => Promise<MarketPriceResponse | null>;
  defaultValues?: Partial<InvestmentTradeFormValues>;
  trigger?: React.ReactNode;
}

function getTradeDefaults(defaultValues?: Partial<InvestmentTradeFormValues>) {
  return {
    account_id: defaultValues?.account_id ?? "",
    broker_name: defaultValues?.broker_name ?? "",
    asset: {
      symbol: defaultValues?.asset?.symbol ?? "",
      display_name: defaultValues?.asset?.display_name ?? "",
      asset_type: defaultValues?.asset?.asset_type ?? "stock",
      market_code: defaultValues?.asset?.market_code ?? "US",
      exchange_code: defaultValues?.asset?.exchange_code ?? "",
      quote_currency: defaultValues?.asset?.quote_currency ?? "USD",
      provider_symbol_twelve:
        defaultValues?.asset?.provider_symbol_twelve ?? "",
      provider_symbol_eodhd: defaultValues?.asset?.provider_symbol_eodhd ?? "",
      is_price_supported: defaultValues?.asset?.is_price_supported ?? true,
    },
    side: defaultValues?.side ?? "buy",
    trade_date: defaultValues?.trade_date ?? format(new Date(), "yyyy-MM-dd"),
    quantity: defaultValues?.quantity ?? (undefined as unknown as number),
    execution_price:
      defaultValues?.execution_price ?? (undefined as unknown as number),
    execution_currency: defaultValues?.execution_currency ?? "USD",
    fee_amount: defaultValues?.fee_amount ?? 0,
    fee_currency: defaultValues?.fee_currency ?? "USD",
    notes: defaultValues?.notes ?? "",
    reference_close_price: defaultValues?.reference_close_price ?? null,
    reference_close_currency: defaultValues?.reference_close_currency ?? null,
    reference_price_date: defaultValues?.reference_price_date ?? null,
    reference_source: defaultValues?.reference_source ?? null,
    reference_status: defaultValues?.reference_status ?? "manual_only",
  } satisfies InvestmentTradeFormValues;
}

export function TradeForm({
  accounts,
  onSubmit,
  lookupPrice,
  defaultValues,
  trigger,
}: TradeFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const form = useForm<InvestmentTradeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentTradeSchema) as any,
    defaultValues: getTradeDefaults(defaultValues),
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
  const quantity = Number(form.watch("quantity")) || 0;
  const executionPrice = Number(form.watch("execution_price")) || 0;
  const tradeDate = form.watch("trade_date");
  const asset = form.watch("asset");

  useEffect(() => {
    if (!open) return;
    form.reset(getTradeDefaults(defaultValues));
  }, [defaultValues, form, open]);

  useEffect(() => {
    if (!selectedAccount) return;
    if (!form.getFieldState("execution_currency").isDirty) {
      form.setValue("execution_currency", selectedAccount.account_currency, {
        shouldValidate: true,
      });
    }
    if (!form.getFieldState("fee_currency").isDirty) {
      form.setValue("fee_currency", selectedAccount.fee_currency, {
        shouldValidate: true,
      });
    }
  }, [form, selectedAccount]);

  useEffect(() => {
    if (!selectedAccount) return;
    if (form.getFieldState("fee_amount").isDirty) return;

    const estimatedFee = estimateTradeFee(selectedAccount, quantity * executionPrice);
    form.setValue("fee_amount", Number(estimatedFee.toFixed(4)));
    form.setValue("fee_currency", selectedAccount.fee_currency);
  }, [executionPrice, form, quantity, selectedAccount]);

  useEffect(() => {
    if (!open || !asset?.symbol || !tradeDate) {
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);

    const timeout = setTimeout(async () => {
      const quote = await lookupPrice({
        asset,
        date: tradeDate,
      });

      if (cancelled) return;

      if (quote?.close) {
        form.setValue("reference_close_price", quote.close);
        form.setValue("reference_close_currency", quote.currency ?? "USD");
        form.setValue("reference_price_date", quote.resolvedDate);
        form.setValue("reference_source", quote.source ?? null);
        form.setValue("reference_status", quote.status);

        if (
          !form.getFieldState("execution_price").isDirty ||
          Number(form.getValues("execution_price")) === 0
        ) {
          form.setValue("execution_price", quote.close, {
            shouldValidate: true,
          });
        }

        if (
          !form.getFieldState("execution_currency").isDirty &&
          quote.currency
        ) {
          form.setValue("execution_currency", quote.currency, {
            shouldValidate: true,
          });
        }
      } else {
        form.setValue("reference_close_price", null);
        form.setValue("reference_close_currency", null);
        form.setValue("reference_price_date", null);
        form.setValue("reference_source", null);
        form.setValue("reference_status", quote?.status ?? "manual_only");
      }

      setQuoteLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      setQuoteLoading(false);
    };
  }, [asset, form, lookupPrice, open, tradeDate]);

  async function handleSubmit(values: InvestmentTradeFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setOpen(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          {t("Add position", "Agregar posición")}
        </SheetTrigger>
      )}

      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[760px]">
        <form className="flex h-full flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
          <SheetHeader className="border-b border-border/70 px-5 py-5">
            <SheetTitle>
              {defaultValues
                ? t("Edit position", "Editar posición")
                : t("Add stock or crypto position", "Agregar posición de acción o cripto")}
            </SheetTitle>
            <SheetDescription>
              {t(
                "Pick the broker, asset, quantity, and purchase or sale price. The app saves the position and keeps the fetched daily close as an optional reference.",
                "Elige broker, activo, cantidad y precio de compra o venta. La app guarda la posición y mantiene el cierre diario consultado como referencia opcional."
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-5 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade-broker">{t("Broker", "Broker")}</Label>
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
                  <SelectTrigger id="trade-broker" className="h-11">
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

              <div className="space-y-2">
                <Label htmlFor="trade-side">{t("Side", "Lado")}</Label>
                <Select
                  value={form.watch("side")}
                  onValueChange={(value) =>
                    value &&
                    form.setValue("side", value as "buy" | "sell", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="trade-side" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">{t("Buy", "Compra")}</SelectItem>
                    <SelectItem value="sell">{t("Sell", "Venta")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {brokerSelectValue === CUSTOM_BROKER_VALUE && (
              <div className="space-y-2">
                <Label htmlFor="custom-broker-name">
                  {t("Custom broker", "Broker personalizado")}
                </Label>
                <Input
                  id="custom-broker-name"
                  placeholder={t("Trii, Webull, Scotiabank...", "Trii, Webull, Scotiabank...")}
                  className="h-11"
                  {...form.register("broker_name")}
                />
              </div>
            )}

            <InvestmentAssetFields form={form} />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="trade-date">{t("Trade date", "Fecha de operación")}</Label>
                <Input
                  id="trade-date"
                  type="date"
                  className="h-11"
                  {...form.register("trade_date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-quantity">{t("Quantity", "Cantidad")}</Label>
                <Input
                  id="trade-quantity"
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  className="h-11 font-mono"
                  {...form.register("quantity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-price">
                  {t("Execution price", "Precio de ejecución")}
                </Label>
                <Input
                  id="trade-price"
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  className="h-11 font-mono"
                  {...form.register("execution_price")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="trade-price-currency">
                  {t("Price currency", "Moneda del precio")}
                </Label>
                <Select
                  value={form.watch("execution_currency")}
                  onValueChange={(value) =>
                    value &&
                    form.setValue("execution_currency", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="trade-price-currency" className="h-11">
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
                <Label htmlFor="trade-fee">{t("Fee amount", "Monto de comisión")}</Label>
                <Input
                  id="trade-fee"
                  type="number"
                  step="0.00000001"
                  min="0"
                  className="h-11 font-mono"
                  {...form.register("fee_amount")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-fee-currency">
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
                  <SelectTrigger id="trade-fee-currency" className="h-11">
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
              <Label htmlFor="trade-notes">{t("Notes", "Notas")}</Label>
              <Input
                id="trade-notes"
                placeholder={t(
                  "Optional notes about the fill or the setup",
                  "Notas opcionales sobre la ejecución o la operación"
                )}
                className="h-11"
                {...form.register("notes")}
              />
            </div>

            <div className="rounded-[1.4rem] border border-border/70 bg-secondary/35 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">
                  {t("Reference market close", "Cierre de mercado de referencia")}
                </p>
                {quoteLoading && (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("Looking up price", "Consultando precio")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">
                {form.watch("reference_close_price")
                  ? `${form.watch("reference_source") ?? t("Provider", "Proveedor")} ${t("returned", "devolvió")} ${form
                      .watch("reference_close_price")
                      ?.toFixed(4)} ${form.watch("reference_close_currency") ?? ""} for ${
                      form.watch("reference_price_date") ?? tradeDate
                    }.`
                  : t(
                      "No provider quote locked yet. Manual execution pricing still works.",
                      "Aún no hay cotización del proveedor fijada. El precio manual de ejecución sigue funcionando."
                    )}
              </p>
            </div>
          </div>

          <SheetFooter className="border-t border-border/60 px-5 py-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {defaultValues
                  ? t("Save position", "Guardar posición")
                  : t("Save position", "Guardar posición")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
