"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations";
import { useCurrency } from "@/providers/currency-provider";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency } from "@/lib/utils";
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
import { CURRENCIES } from "@/lib/constants";
import { CategoryBadge, CategoryIcon } from "@/components/shared/category-badge";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocale } from "@/providers/locale-provider";

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => Promise<unknown>;
  defaultValues?: Partial<ExpenseFormValues>;
  trigger?: React.ReactNode;
}

export function ExpenseForm({
  onSubmit,
  defaultValues,
  trigger,
}: ExpenseFormProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { baseCurrency, convert } = useCurrency();
  const { categories } = useCategories();

  const today = format(new Date(), "yyyy-MM-dd");
  const resolvedDefaults = useMemo(
    () => ({
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_id: defaultValues?.category_id ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date ?? today,
    }),
    [
      baseCurrency,
      defaultValues?.amount,
      defaultValues?.category_id,
      defaultValues?.currency,
      defaultValues?.description,
      defaultValues?.date,
      today,
    ]
  );

  const form = useForm<ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: resolvedDefaults,
  });

  const amount = Number(form.watch("amount")) || 0;
  const currency = form.watch("currency");
  const categoryId = form.watch("category_id");
  const description = form.watch("description")?.trim() ?? "";
  const date = form.watch("date") || today;
  const convertedAmount = convert(amount, currency);
  const selectedCategory = categories.find((category) => category.id === categoryId);

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

  async function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setOpen(false);
      form.reset(resolvedDefaults);
    }
  }

  const composerTitle = defaultValues?.amount
    ? t("Edit expense", "Editar gasto")
    : t("Add expense", "Agregar gasto");
  const composerDescription = defaultValues?.amount
    ? t(
        "Refine the entry without losing the original rhythm of the record.",
        "Ajusta el registro sin perder el ritmo original del movimiento."
      )
    : t(
        "Capture the amount first, then attach context while the detail is still fresh.",
        "Captura primero el monto y luego agrega contexto mientras el detalle sigue fresco."
      );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          {t("Add expense", "Agregar gasto")}
        </SheetTrigger>
      )}

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-hidden border-border/80 bg-popover/96 p-0 shadow-[0_34px_100px_-56px_rgba(0,0,0,0.95)] data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-[2rem] data-[side=bottom]:border-t sm:max-w-[590px] data-[side=right]:sm:max-w-[590px]"
      >
        <form className="flex h-full flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
          <SheetHeader className="border-b border-border/70 bg-background/90 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
                <Plus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-lg">{composerTitle}</SheetTitle>
                <SheetDescription>{composerDescription}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                        {t("Amount first", "Monto primero")}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(
                          "Enter the original amount, then choose the currency that belongs to the receipt.",
                          "Ingresa el monto original y luego elige la moneda del comprobante."
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/70 px-3 py-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Base", "Base")}
                      </p>
                      <p className="mt-1 font-mono text-xs font-medium">
                        {baseCurrency}
                      </p>
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
                  <Label htmlFor="category">{t("Category", "Categoría")}</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(value) =>
                      value &&
                      form.setValue("category_id", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="category" className="h-11">
                      <SelectValue placeholder={t("Select category", "Selecciona categoría")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          className="text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon
                              icon={category.icon}
                              color={category.color}
                              className="h-5 w-5 rounded-xl"
                            />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category_id && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.category_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">{t("Date", "Fecha")}</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-11"
                    {...form.register("date")}
                  />
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
                    placeholder={t(
                      "What was this expense for?",
                      "¿Para qué fue este gasto?"
                    )}
                    className="h-11"
                    {...form.register("description")}
                  />
                </div>
              </div>

              <aside className="lg:sticky lg:top-5">
                <div className="rounded-[1.75rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.88)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                        {t("Live preview", "Vista previa")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(
                          "What will be stored and shown in the ledger.",
                          "Lo que se guardará y se mostrará en el registro."
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/70 px-3 py-2 text-foreground">
                      <p className="text-[0.66rem] uppercase tracking-[0.22em]">
                        {t("Month", "Mes")}
                      </p>
                      <p className="mt-1 font-mono text-xs font-medium">
                        {format(new Date(date), "MMM d")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-secondary/45 p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                      {t("Amount in reports", "Monto en reportes")}
                    </p>
                    <p className="mt-3 font-heading text-[2.65rem] font-semibold leading-none tracking-[-0.05em]">
                      {amount > 0
                        ? formatCurrency(convertedAmount, baseCurrency)
                        : "--"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {amount > 0
                        ? t(
                            `${formatCurrency(amount, currency)} original entry`,
                            `${formatCurrency(amount, currency)} registro original`
                          )
                        : t(
                            "Enter an amount to see how the report will read.",
                            "Ingresa un monto para ver cómo aparecerá en el reporte."
                          )}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                      {selectedCategory ? (
                        <CategoryBadge
                          name={selectedCategory.name}
                          icon={selectedCategory.icon}
                          color={selectedCategory.color}
                          className="rounded-xl px-2.5 py-1"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t("Select a category", "Selecciona una categoría")}
                        </span>
                      )}
                    </div>
                    <div className="rounded-[1.35rem] border border-border/70 bg-secondary/45 p-3 text-sm text-muted-foreground">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em]">
                        {t("Date", "Fecha")}
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {format(new Date(date), "EEEE, MMMM d")}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-border/70 bg-secondary/45 p-3 text-sm text-muted-foreground">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em]">
                        {t("Description", "Descripción")}
                      </p>
                      <p className="mt-2 leading-6 text-foreground">
                        {description || t("No description yet", "Sin descripción todavía")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-border/70 bg-secondary/60 p-3 text-sm text-muted-foreground">
                    {t(
                      "The original currency is preserved, and reporting converts it into your base currency automatically.",
                      "La moneda original se conserva y los reportes la convierten automáticamente a tu moneda base."
                    )}
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
                  : t("Add expense", "Agregar gasto")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
