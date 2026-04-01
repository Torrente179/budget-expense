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
    <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/80 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "symbol")}>Symbol</Label>
          <Input
            id={assetField(prefix, "symbol")}
            placeholder="AAPL, BTC, ECOPETROL..."
            className="h-11 uppercase"
            {...form.register(assetField(prefix, "symbol"))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "display_name")}>Display name</Label>
          <Input
            id={assetField(prefix, "display_name")}
            placeholder="Apple, Bitcoin, Ecopetrol..."
            className="h-11"
            {...form.register(assetField(prefix, "display_name"))}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "asset_type")}>Asset type</Label>
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
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="etf">ETF</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "market_code")}>Market</Label>
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
              <SelectItem value="CO">Colombia</SelectItem>
              <SelectItem value="CRYPTO">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={assetField(prefix, "quote_currency")}>
            Quote currency
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
            Exchange code
          </Label>
          <Input
            id={assetField(prefix, "exchange_code")}
            placeholder={marketCode === "CO" ? "XBOG" : "Optional"}
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
            placeholder={marketCode === "CRYPTO" ? "BTC/USD" : "Optional"}
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
              ? "Best-effort for Colombian stocks. Add if you know the provider symbol."
              : "Optional fallback symbol"
          }
          className="h-11"
          {...form.register(assetField(prefix, "provider_symbol_eodhd"))}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Colombian price autofill is best effort in v1. Leave the provider
          fields blank if you want to track the asset manually.
        </p>
      </div>
    </div>
  );
}
