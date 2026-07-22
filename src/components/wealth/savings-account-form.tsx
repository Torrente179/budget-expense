"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentSavingsAccountSchema,
  type InvestmentSavingsAccountFormValues,
} from "@/lib/validations";
import {
  SAVINGS_COUNTRY_CODES,
  findSavingsBank,
  getSavingsBanks,
  getSavingsProducts,
  type SavingsCountryCode,
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
import { Landmark, Loader2, Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface SavingsAccountFormProps {
  onSubmit: (values: InvestmentSavingsAccountFormValues) => Promise<unknown>;
  defaultValues?: Partial<InvestmentSavingsAccountFormValues>;
  trigger?: React.ReactNode;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getDefaults(
  values?: Partial<InvestmentSavingsAccountFormValues>
): InvestmentSavingsAccountFormValues {
  const countryCode = (values?.country_code ?? "CO") as SavingsCountryCode;
  const bank =
    findSavingsBank(countryCode, values?.bank_code ?? "") ??
    getSavingsBanks(countryCode)[0];
  const product =
    bank.products.find((item) => item.productType === values?.product_type) ??
    bank.products[0];

  return {
    country_code: countryCode,
    bank_code: values?.bank_code ?? bank.bankCode,
    bank_name: values?.bank_name ?? bank.bankName,
    product_type: values?.product_type ?? product.productType,
    product_name: values?.product_name ?? product.productName,
    account_name: values?.account_name ?? `${bank.bankName} principal`,
    currency: values?.currency ?? product.defaultCurrency,
  };
}

export function SavingsAccountForm({
  onSubmit,
  defaultValues,
  trigger,
  controlledOpen,
  onOpenChange,
}: SavingsAccountFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const resolvedOpen = isControlled ? controlledOpen : open;
  const setResolvedOpen = isControlled
    ? (value: boolean) => onOpenChange?.(value)
    : setOpen;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestmentSavingsAccountFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentSavingsAccountSchema) as any,
    defaultValues: getDefaults(defaultValues),
  });

  const countryCode = form.watch("country_code") as SavingsCountryCode;
  const bankCode = form.watch("bank_code");
  const productType = form.watch("product_type");

  const bankOptions = useMemo(() => getSavingsBanks(countryCode), [countryCode]);
  const selectedBank =
    findSavingsBank(countryCode, bankCode) ?? bankOptions[0] ?? null;
  const productOptions = selectedBank
    ? getSavingsProducts(countryCode, selectedBank.bankCode)
    : [];
  const selectedProduct =
    productOptions.find((item) => item.productType === productType) ??
    productOptions[0] ??
    null;

  useEffect(() => {
    if (!resolvedOpen) return;
    form.reset(getDefaults(defaultValues));
  }, [defaultValues, form, resolvedOpen]);

  useEffect(() => {
    if (!selectedBank) return;

    form.setValue("bank_code", selectedBank.bankCode, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("bank_name", selectedBank.bankName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!selectedProduct) return;

    form.setValue("product_type", selectedProduct.productType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("product_name", selectedProduct.productName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!form.getFieldState("currency").isDirty) {
      form.setValue("currency", selectedProduct.defaultCurrency, {
        shouldValidate: true,
      });
    }
  }, [form, selectedBank, selectedProduct]);

  async function handleSubmit(values: InvestmentSavingsAccountFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setResolvedOpen(false);
    }
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={setResolvedOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : !isControlled ? (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">{t("Add savings account", "Agregar cuenta de ahorro")}</span>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues
              ? t("Edit savings account", "Editar cuenta de ahorro")
              : t("Add savings account", "Agregar cuenta de ahorro")}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(
              "Define the bank, product, and currency that will receive investment transfers from your main balance.",
              "Define el banco, producto y moneda que recibirá transferencias de inversión desde tu balance principal."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="savings-country">{t("Country", "País")}</Label>
              <Select
                value={countryCode}
                onValueChange={(value) => {
                  if (!value) return;
                  const nextCountry = value as SavingsCountryCode;
                  const nextBank = getSavingsBanks(nextCountry)[0];
                  form.setValue("country_code", nextCountry, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("bank_code", nextBank.bankCode, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger id="savings-country" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAVINGS_COUNTRY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code === "CO"
                        ? t("Colombia", "Colombia")
                        : t("Spain", "Espana")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-bank">{t("Bank", "Banco")}</Label>
              <Select
                value={selectedBank?.bankCode ?? ""}
                onValueChange={(value) => {
                  if (!value) return;
                  const nextBank = findSavingsBank(countryCode, value);
                  if (!nextBank) return;
                  form.setValue("bank_code", nextBank.bankCode, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger id="savings-bank" className="h-11">
                  <SelectValue placeholder={t("Select a bank", "Selecciona un banco")} />
                </SelectTrigger>
                <SelectContent>
                  {bankOptions.map((bank) => (
                    <SelectItem key={bank.bankCode} value={bank.bankCode}>
                      {bank.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="savings-product">{t("Product", "Producto")}</Label>
              <Select
                value={selectedProduct?.productType ?? ""}
                onValueChange={(value) => {
                  if (!value) return;
                  const nextProduct = productOptions.find(
                    (item) => item.productType === value
                  );
                  if (!nextProduct) return;
                  form.setValue("product_type", nextProduct.productType, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("currency", nextProduct.defaultCurrency, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger id="savings-product" className="h-11">
                  <SelectValue placeholder={t("Select product", "Selecciona producto")} />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((product) => (
                    <SelectItem key={product.productType} value={product.productType}>
                      {product.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-currency">{t("Currency", "Moneda")}</Label>
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
                <SelectTrigger id="savings-currency" className="h-11">
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
            <Label htmlFor="savings-account-name">
              {t("Account label", "Etiqueta de cuenta")}
            </Label>
            <Input
              id="savings-account-name"
              className="h-11"
              placeholder={t("Main savings, emergency reserve...", "Ahorro principal, reserva de emergencia...")}
              {...form.register("account_name")}
            />
            {form.formState.errors.account_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.account_name.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("Preview", "Vista previa")}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              {selectedBank?.bankName ?? "-"} - {selectedProduct?.productName ?? "-"}
              {" "}
              ({form.watch("account_name") || "-"})
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResolvedOpen(false)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues
                ? t("Save account", "Guardar cuenta")
                : t("Create account", "Crear cuenta")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
