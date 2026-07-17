"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CURRENCIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/providers/locale-provider";

interface InvestmentAssetFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  prefix?: string;
}

function assetField(prefix: string | undefined, name: string) {
  return prefix ? `${prefix}.${name}` : name;
}

function getDefaultCurrency(marketCode: string) {
  return marketCode === "CO" ? "COP" : "USD";
}

export function InvestmentAssetFields({
  form,
  prefix = "asset",
}: InvestmentAssetFieldsProps) {
  const { t } = useLocale();
  const marketCode = form.watch(assetField(prefix, "market_code"));
  const assetType = form.watch(assetField(prefix, "asset_type"));

  useEffect(() => {
    if (!marketCode) return;
    const fieldName = assetField(prefix, "quote_currency");
    const current = form.getValues(fieldName);
    if (!current) {
      form.setValue(fieldName, getDefaultCurrency(marketCode));
    }
  }, [form, marketCode, prefix]);

  useEffect(() => {
    if (!assetType || marketCode !== "CRYPTO") return;
    const fieldName = assetField(prefix, "quote_currency");
    if (!form.getValues(fieldName)) {
      form.setValue(fieldName, "USD");
    }
  }, [assetType, form, marketCode, prefix]);

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/80 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "symbol")}>
            {t("Symbol", "Símbolo")}
          </Label>
          <Input
            id={assetField(prefix, "symbol")}
            placeholder={t("AAPL, BTC, ECOPETROL...", "AAPL, BTC, ECOPETROL...")}
            className="h-11 uppercase"
            {...form.register(assetField(prefix, "symbol"))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "display_name")}>
            {t("Display name", "Nombre visible")}
          </Label>
          <Input
            id={assetField(prefix, "display_name")}
            placeholder={t("Apple, Bitcoin, Ecopetrol...", "Apple, Bitcoin, Ecopetrol...")}
            className="h-11"
            {...form.register(assetField(prefix, "display_name"))}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "asset_type")}>
            {t("Asset type", "Tipo de activo")}
          </Label>
          <Select
            value={form.watch(assetField(prefix, "asset_type"))}
            onValueChange={(value) =>
              value &&
              form.setValue(assetField(prefix, "asset_type"), value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id={assetField(prefix, "asset_type")}
              className="h-11"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock">{t("Stock", "Acción")}</SelectItem>
              <SelectItem value="etf">ETF</SelectItem>
              <SelectItem value="crypto">{t("Crypto", "Cripto")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "market_code")}>
            {t("Market", "Mercado")}
          </Label>
          <Select
            value={form.watch(assetField(prefix, "market_code"))}
            onValueChange={(value) => {
              if (!value) return;
              form.setValue(assetField(prefix, "market_code"), value, {
                shouldDirty: true,
                shouldValidate: true,
              });
              form.setValue(
                assetField(prefix, "quote_currency"),
                getDefaultCurrency(value),
                {
                  shouldDirty: true,
                }
              );
            }}
          >
            <SelectTrigger
              id={assetField(prefix, "market_code")}
              className="h-11"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="CO">{t("Colombia", "Colombia")}</SelectItem>
              <SelectItem value="CRYPTO">{t("Crypto", "Cripto")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "quote_currency")}>
            {t("Quote currency", "Moneda de cotización")}
          </Label>
          <Select
            value={form.watch(assetField(prefix, "quote_currency"))}
            onValueChange={(value) =>
              value &&
              form.setValue(assetField(prefix, "quote_currency"), value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id={assetField(prefix, "quote_currency")}
              className="h-11 font-mono text-sm"
            >
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
          <Label htmlFor={assetField(prefix, "exchange_code")}>
            {t("Exchange code", "Código de bolsa")}
          </Label>
          <Input
            id={assetField(prefix, "exchange_code")}
            placeholder={marketCode === "CO" ? "XBOG" : t("Optional", "Opcional")}
            className="h-11 uppercase"
            {...form.register(assetField(prefix, "exchange_code"))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "provider_symbol_twelve")}>
            Twelve Data symbol
          </Label>
          <Input
            id={assetField(prefix, "provider_symbol_twelve")}
            placeholder={
              marketCode === "CRYPTO" ? "BTC/USD" : t("Optional", "Opcional")
            }
            className="h-11"
            {...form.register(assetField(prefix, "provider_symbol_twelve"))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={assetField(prefix, "provider_symbol_eodhd")}>
          EODHD symbol
        </Label>
        <Input
          id={assetField(prefix, "provider_symbol_eodhd")}
          placeholder={
            marketCode === "CO"
              ? t(
                  "Best-effort for Colombian stocks. Add if you know the provider symbol.",
                  "Soporte limitado para acciones colombianas. Agrégalo si conoces el símbolo del proveedor."
                )
              : t("Optional fallback symbol", "Símbolo alterno opcional")
          }
          className="h-11"
          {...form.register(assetField(prefix, "provider_symbol_eodhd"))}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {t(
            "Colombian price autofill is best effort in v1. Leave the provider fields blank if you want to track the asset manually.",
            "El autocompletado de precios colombianos es de mejor esfuerzo en v1. Deja estos campos vacíos si quieres seguir el activo manualmente."
          )}
        </p>
      </div>
    </div>
  );
}
