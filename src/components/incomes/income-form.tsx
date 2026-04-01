"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import { incomeSchema, type IncomeFormValues } from "@/lib/validations";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IncomeFormProps {
  onSubmit: (values: IncomeFormValues) => Promise<unknown>;
  defaultValues?: Partial<IncomeFormValues>;
  trigger?: React.ReactNode;
}

export function IncomeForm({ onSubmit, defaultValues, trigger }: IncomeFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { baseCurrency, convert } = useCurrency();

  const today = format(new Date(), "yyyy-MM-dd");
  const resolvedDefaults = useMemo(
    () => ({
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      source: defaultValues?.source ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date ?? today,
    }),
    [
      baseCurrency,
      defaultValues?.amount,
      defaultValues?.currency,
      defaultValues?.source,
      defaultValues?.description,
      defaultValues?.date,
      today,
    ]
  );

  const form = useForm<IncomeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: resolvedDefaults,
  });

  const amount = Number(form.watch("amount")) || 0;
  const currency = form.watch("currency");
  const source = form.watch("source")?.trim() ?? "";
  const description = form.watch("description")?.trim() ?? "";
  const date = form.watch("date") || today;
  const convertedAmount = convert(amount, currency);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (open) {
      form.reset(resolvedDefaults);
    }
  }, [open, form, resolvedDefaults]);

  async function handleSubmit(values: IncomeFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setOpen(false);
      form.reset(resolvedDefaults);
    }
  }

  const composerTitle = defaultValues?.amount
    ? t("Edit income", "Editar ingreso")
    : t("Add income", "Agregar ingreso");

  const composerDescription = defaultValues?.amount
    ? t(
        "Adjust this movement while keeping your gain history coherent.",
        "Ajusta este movimiento manteniendo coherente tu historial de ganancias."
      )
    : t(
        "Log each gain so the available total stays accurate.",
        "Registra cada ganancia para que el total disponible sea preciso."
      );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          {t("Add income", "Agregar ingreso")}
        </SheetTrigger>
      )}

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-hidden border-border/80 bg-popover/96 p-0 shadow-[0_34px_100px_-56px_rgba(0,0,0,0.95)] data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-[2rem] data-[side=bottom]:border-t sm:max-w-[560px] data-[side=right]:sm:max-w-[560px]"
      >
        <form className="flex h-full flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
          <SheetHeader className="border-b border-border/70 bg-background/90 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-lg">{composerTitle}</SheetTitle>
                <SheetDescription>{composerDescription}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                        {t("Amount first", "Monto primero")}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(
                          "Use the original amount and currency from the transfer or invoice.",
                          "Usa el monto y la moneda original de la transferencia o factura."
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/70 px-3 py-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Base", "Base")}
                      </p>
                      <p className="mt-1 font-mono text-xs font-medium">{baseCurrency}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_150px]">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t("Amount", "Monto")}</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="h-11 font-mono text-base"
                        {...form.register("amount")}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.amount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">{t("Currency", "Moneda")}</Label>
                      <Select
                        value={currency}
                        onValueChange={(value) =>
                          value &&
                          form.setValue("currency", value, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger id="currency" className="h-11 font-mono text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((item) => (
                            <SelectItem key={item.code} value={item.code} className="text-sm">
                              {item.flag} {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">{t("Source", "Origen")}</Label>
                  <Input
                    id="source"
                    className="h-11"
                    placeholder={t("Salary, freelance, sale...", "Salario, freelance, venta...")}
                    {...form.register("source")}
                  />
                  {form.formState.errors.source && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.source.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">{t("Date", "Fecha")}</Label>
                  <Input id="date" type="date" className="h-11" {...form.register("date")} />
                  {form.formState.errors.date && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t("Description", "Descripción")}{" "}
                    <span className="text-muted-foreground">
                      ({t("optional", "opcional")})
                    </span>
                  </Label>
                  <Input
                    id="description"
                    className="h-11"
                    placeholder={t(
                      "Optional note for this income movement",
                      "Nota opcional para este movimiento de ingreso"
                    )}
                    {...form.register("description")}
                  />
                </div>
              </div>

              <aside className="lg:sticky lg:top-5">
                <div className="rounded-[1.75rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.88)]">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                    {t("Live preview", "Vista previa")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      "This movement increases your available total.",
                      "Este movimiento aumenta tu total disponible."
                    )}
                  </p>

                  <div className="mt-5 rounded-[1.4rem] border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-emerald-300">
                      {t("Amount in reports", "Monto en reportes")}
                    </p>
                    <p className="mt-3 font-heading text-[2.2rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                      {amount > 0 ? formatCurrency(convertedAmount, baseCurrency) : "--"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {amount > 0
                        ? t(
                            `${formatCurrency(amount, currency)} original entry`,
                            `${formatCurrency(amount, currency)} registro original`
                          )
                        : t(
                            "Enter amount to preview conversion.",
                            "Ingresa un monto para previsualizar la conversión."
                          )}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-[1.2rem] border border-border/70 bg-secondary/45 p-3 text-sm">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Source", "Origen")}
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {source || t("No source yet", "Sin origen todavía")}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-border/70 bg-secondary/45 p-3 text-sm">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Date", "Fecha")}
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {format(new Date(date), "EEEE, MMMM d")}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-border/70 bg-secondary/45 p-3 text-sm">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Description", "Descripción")}
                      </p>
                      <p className="mt-2 leading-6 text-foreground">
                        {description || t("No description yet", "Sin descripción todavía")}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <SheetFooter className="border-t border-border/60 bg-background/82 px-5 py-4 backdrop-blur-sm">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {defaultValues?.amount
                  ? t("Save changes", "Guardar cambios")
                  : t("Add income", "Agregar ingreso")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
