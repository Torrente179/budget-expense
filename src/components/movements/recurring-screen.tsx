"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { useCategories } from "@/hooks/use-categories";
import { useLocale } from "@/providers/locale-provider";
import { normalizeDecimalInput, parseDecimalInput } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { Screen } from "@/components/patterns/screen";
import { AmountText } from "@/components/patterns/amount-text";
import { CategoryIcon } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Database } from "@/types/database";

type RecurringExpense =
  Database["public"]["Tables"]["recurring_expenses"]["Row"] & {
    categories: Database["public"]["Tables"]["categories"]["Row"];
  };

interface FormState {
  id?: string;
  amount: string;
  currency: string;
  categoryId: string;
  chargeDay: string;
  startDate: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  amount: "",
  currency: "EUR",
  categoryId: "",
  chargeDay: "1",
  startDate: format(new Date(), "yyyy-MM-dd"),
  description: "",
  isActive: true,
};

/** Manage monthly recurring charges (materialized into expenses on read). */
export function RecurringScreen() {
  const { t, tc } = useLocale();
  const {
    recurringExpenses,
    loading,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useRecurringExpenses();
  const { categories } = useCategories();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...recurringExpenses].sort((a, b) => a.charge_day - b.charge_day),
    [recurringExpenses]
  );

  const parsedAmount = form ? parseDecimalInput(form.amount) : null;
  const canSubmit =
    form !== null &&
    typeof parsedAmount === "number" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    form.categoryId !== "" &&
    Number(form.chargeDay) >= 1 &&
    Number(form.chargeDay) <= 31 &&
    !saving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !canSubmit) return;
    setSaving(true);
    const payload = {
      amount: parsedAmount as number,
      currency: form.currency,
      category_id: form.categoryId,
      charge_day: Number(form.chargeDay),
      start_date: form.startDate,
      description: form.description.trim() || undefined,
      is_active: form.isActive,
    };
    const error = form.id
      ? await updateRecurringExpense(form.id, {
          ...payload,
          description: form.description.trim() || null,
        })
      : await addRecurringExpense(payload);
    setSaving(false);
    if (error) {
      toast.error(t("Could not save", "No se pudo guardar"));
      return;
    }
    toast.success(
      form.id
        ? t("Recurring charge updated", "Cargo recurrente actualizado")
        : t("Recurring charge added", "Cargo recurrente añadido")
    );
    setForm(null);
  }

  async function handleDelete(recurring: RecurringExpense) {
    const error = await deleteRecurringExpense(recurring.id);
    if (error) {
      toast.error(t("Could not delete", "No se pudo eliminar"));
    } else {
      toast.success(t("Recurring charge deleted", "Cargo recurrente eliminado"));
      setForm(null);
    }
  }

  function openEdit(recurring: RecurringExpense) {
    setForm({
      id: recurring.id,
      amount: String(recurring.amount),
      currency: recurring.currency,
      categoryId: recurring.category_id,
      chargeDay: String(recurring.charge_day),
      startDate: recurring.start_date,
      description: recurring.description ?? "",
      isActive: recurring.is_active,
    });
  }

  return (
    <Screen
      title={t("Recurring", "Recurrentes")}
      backHref="/movements"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-full"
          onClick={() => setForm({ ...EMPTY_FORM })}
        >
          <Plus className="h-4 w-4" />
          {t("Add", "Añadir")}
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={t("No recurring charges", "Sin cargos recurrentes")}
          description={t(
            "Monthly bills you add here are created automatically each month.",
            "Las facturas mensuales que agregues aquí se crean automáticamente cada mes."
          )}
        />
      ) : (
        <div className="-mx-4 divide-y divide-border/40 md:mx-0 md:overflow-hidden md:rounded-xl md:bg-card md:ring-1 md:ring-border md:shadow-1">
          {sorted.map((recurring) => (
            <button
              key={recurring.id}
              type="button"
              onClick={() => openEdit(recurring)}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50"
            >
              <CategoryIcon
                icon={recurring.categories?.icon ?? "repeat"}
                color={recurring.categories?.color ?? "var(--muted-foreground)"}
                className="h-9 w-9 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">
                  {recurring.description ||
                    tc(recurring.categories?.name ?? "—")}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {t("Day", "Día")} {recurring.charge_day} ·{" "}
                  {recurring.is_active
                    ? t("Active", "Activo")
                    : t("Paused", "Pausado")}
                </p>
              </div>
              <AmountText
                amount={-Math.abs(recurring.amount)}
                currency={recurring.currency}
                tone={recurring.is_active ? "negative" : "muted"}
              />
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
        >
          <SheetHeader className="px-5 pb-3 pt-4">
            <SheetTitle className="text-heading">
              {form?.id
                ? t("Edit recurring charge", "Editar cargo recurrente")
                : t("New recurring charge", "Nuevo cargo recurrente")}
            </SheetTitle>
          </SheetHeader>
          {form && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 px-5 pb-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="recurring-amount">
                  {t("Amount", "Importe")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="recurring-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        amount: normalizeDecimalInput(event.target.value),
                      })
                    }
                    className="h-12 flex-1 font-mono text-xl tabular-nums text-negative"
                  />
                  <Select
                    value={form.currency}
                    onValueChange={(value) =>
                      setForm({ ...form, currency: value ?? "EUR" })
                    }
                  >
                    <SelectTrigger
                      aria-label={t("Currency", "Moneda")}
                      className="h-12 w-24 font-mono text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((item) => (
                        <SelectItem
                          key={item.code}
                          value={item.code}
                          className="text-sm"
                        >
                          {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recurring-description">
                  {t("Description", "Descripción")}{" "}
                  <span className="text-muted-foreground">
                    {t("(optional)", "(opcional)")}
                  </span>
                </Label>
                <Input
                  id="recurring-description"
                  autoComplete="off"
                  placeholder={t("e.g. Rent", "p. ej. Alquiler")}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-category">
                    {t("Category", "Categoría")}
                  </Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(value) =>
                      setForm({ ...form, categoryId: value ?? "" })
                    }
                  >
                    <SelectTrigger id="recurring-category" className="h-11">
                      <SelectValue placeholder={t("Select", "Selecciona")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          className="text-sm"
                        >
                          {tc(category.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-day">
                    {t("Charge day", "Día de cargo")}
                  </Label>
                  <Input
                    id="recurring-day"
                    type="number"
                    min={1}
                    max={31}
                    value={form.chargeDay}
                    onChange={(event) =>
                      setForm({ ...form, chargeDay: event.target.value })
                    }
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recurring-start">
                    {t("Starts", "Comienza")}
                  </Label>
                  <Input
                    id="recurring-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({ ...form, startDate: event.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <label className="flex h-11 items-center justify-between gap-2 rounded-lg border border-border px-3">
                  <span className="text-body">{t("Active", "Activo")}</span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, isActive: checked })
                    }
                  />
                </label>
              </div>

              <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-popover/96 pb-1 pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-full text-base"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" />
                  ) : form.id ? (
                    t("Save changes", "Guardar cambios")
                  ) : (
                    t("Add recurring charge", "Añadir cargo recurrente")
                  )}
                </Button>
                {form.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 w-full"
                    onClick={() => {
                      const target = sorted.find((r) => r.id === form.id);
                      if (target) void handleDelete(target);
                    }}
                  >
                    {t("Delete", "Eliminar")}
                  </Button>
                )}
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </Screen>
  );
}
