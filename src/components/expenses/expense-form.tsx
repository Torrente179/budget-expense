"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations";
import { useCurrency } from "@/providers/currency-provider";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
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
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => Promise<unknown>;
  defaultValues?: Partial<ExpenseFormValues>;
  trigger?: React.ReactNode;
  categories?: Category[];
}

export function ExpenseForm({
  onSubmit,
  defaultValues,
  trigger,
  categories: categoriesProp,
}: ExpenseFormProps) {
  const { t, tc } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { baseCurrency, convert } = useCurrency();
  const { categories: fetchedCategories } = useCategories();
  const categories = categoriesProp ?? fetchedCategories;

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

  const amount = parseDecimalInput(form.watch("amount")) || 0;
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
        className="w-full overflow-hidden border-border/80 bg-popover/96 p-0 shadow-[0_34px_100px_-56px_rgba(0,0,0,0.95)] data-[side=bottom]:h-[90vh] data-[side=bottom]:max-h-[90vh] data-[side=bottom]:h-[90dvh] data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-[2rem] data-[side=bottom]:border-t sm:max-w-[760px] data-[side=right]:sm:max-w-[760px]"
      >
        <form className="flex h-full min-h-0 flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
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

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Expense details", "Detalles del gasto")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(
                          "Capture the movement exactly as it appears on the receipt.",
                          "Registra el movimiento tal como aparece en el comprobante."
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-secondary/65 px-2.5 py-2 text-right">
                      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Base", "Base")}
                      </p>
                      <p className="mt-1 font-mono text-xs font-medium">{baseCurrency}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_150px]">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t("Amount", "Monto")}</Label>
                      <Input
                        id="amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.00"
                        className="h-11 font-mono text-base"
                        {...form.register("amount", {
                          setValueAs: (value) => parseDecimalInput(value),
                        })}
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

                  <div className="mt-4 space-y-4">
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
                          <SelectValue
                            placeholder={t("Select category", "Selecciona categoría")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id} className="text-sm">
                              <div className="flex items-center gap-2">
                                <CategoryIcon
                                  icon={category.icon}
                                  color={category.color}
                                  className="h-5 w-5 rounded-xl"
                                />
                                <span>{tc(category.name)}</span>
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
                        placeholder={t(
                          "What was this expense for?",
                          "¿Para qué fue este gasto?"
                        )}
                        className="h-11"
                        {...form.register("description")}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <aside className="lg:sticky lg:top-5 lg:self-start">
                <div className="rounded-[1.5rem] border border-border/80 bg-card/96 p-4 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.88)]">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Quick summary", "Resumen rápido")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      "Review how this expense will look before saving.",
                      "Revisa cómo se verá este gasto antes de guardar."
                    )}
                  </p>

                  <div className="mt-4 rounded-xl border border-border/70 bg-secondary/45 p-3.5">
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                      {t("Amount in reports", "Monto en reportes")}
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold leading-none tracking-[-0.04em]">
                      {amount > 0 ? formatCurrency(convertedAmount, baseCurrency) : "--"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {amount > 0
                        ? t(
                            `Original: ${formatCurrency(amount, currency)}`,
                            `Original: ${formatCurrency(amount, currency)}`
                          )
                        : t(
                            "Enter an amount to preview conversion.",
                            "Ingresa un monto para previsualizar la conversión."
                          )}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-sm">
                      <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Category", "Categoría")}
                      </p>
                      <div className="mt-1.5">
                        {selectedCategory ? (
                          <CategoryBadge
                            name={tc(selectedCategory.name)}
                            icon={selectedCategory.icon}
                            color={selectedCategory.color}
                            className="rounded-lg px-2.5 py-1"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {t("Select a category", "Selecciona una categoría")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-sm">
                      <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Date", "Fecha")}
                      </p>
                      <p className="mt-1.5 text-foreground">
                        {format(new Date(date), "EEEE, MMMM d")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-sm">
                      <p className="text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Description", "Descripción")}
                      </p>
                      <p className="mt-1.5 text-foreground">
                        {description || t("No description yet", "Sin descripción todavía")}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "The original currency is preserved and reports convert it automatically to your base currency.",
                      "La moneda original se conserva y los reportes la convierten automáticamente a tu moneda base."
                    )}
                  </p>
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
