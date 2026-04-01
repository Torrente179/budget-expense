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
          Add watchlist asset
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues ? "Edit watchlist item" : "Add watchlist item"}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Track ideas even before you own them. Price coverage stays best
            effort for Colombian assets in v1.
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <InvestmentAssetFields form={form} />

          <div className="space-y-2">
            <Label htmlFor="watchlist-note">Note</Label>
            <Input
              id="watchlist-note"
              placeholder="Reason for tracking, thesis, entry zone..."
              className="h-11"
              {...form.register("note")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues ? "Save asset" : "Add to watchlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
