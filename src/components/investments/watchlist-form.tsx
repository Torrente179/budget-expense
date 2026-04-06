"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentWatchlistSchema,
  type InvestmentWatchlistFormValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvestmentAssetFields } from "@/components/investments/investment-asset-fields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface WatchlistFormProps {
  onSubmit: (values: InvestmentWatchlistFormValues) => Promise<unknown>;
  defaultValues?: Partial<InvestmentWatchlistFormValues>;
  trigger?: React.ReactNode;
}

function getDefaults(defaultValues?: Partial<InvestmentWatchlistFormValues>) {
  return {
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
    note: defaultValues?.note ?? "",
  } satisfies InvestmentWatchlistFormValues;
}

export function WatchlistForm({
  onSubmit,
  defaultValues,
  trigger,
}: WatchlistFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestmentWatchlistFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentWatchlistSchema) as any,
    defaultValues: getDefaults(defaultValues),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaults(defaultValues));
  }, [defaultValues, form, open]);

  async function handleSubmit(values: InvestmentWatchlistFormValues) {
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
          <span className="hidden md:inline">{t("Add watchlist asset", "Agregar activo en seguimiento")}</span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues
              ? t("Edit watchlist item", "Editar activo en seguimiento")
              : t("Add watchlist item", "Agregar activo en seguimiento")}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(
              "Track ideas even before you own them. Price coverage stays best effort for Colombian assets in v1.",
              "Sigue ideas incluso antes de tenerlas. La cobertura de precios para activos colombianos es de mejor esfuerzo en v1."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <InvestmentAssetFields form={form} />

          <div className="space-y-2">
            <Label htmlFor="watchlist-note">{t("Note", "Nota")}</Label>
            <Input
              id="watchlist-note"
              placeholder={t(
                "Reason for tracking, thesis, entry zone...",
                "Motivo de seguimiento, tesis, zona de entrada..."
              )}
              className="h-11"
              {...form.register("note")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues
                ? t("Save asset", "Guardar activo")
                : t("Add to watchlist", "Agregar al seguimiento")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
