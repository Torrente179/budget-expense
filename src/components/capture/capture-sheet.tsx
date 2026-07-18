"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CategoryBadge } from "@/components/shared/category-badge";
import { useCategories } from "@/hooks/use-categories";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCapture } from "@/hooks/use-capture";
import {
  readCaptureDefaults,
  writeCaptureDefaults,
} from "@/lib/capture/defaults";
import { CURRENCIES } from "@/lib/constants";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { cn, normalizeDecimalInput, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export type CaptureKind = "expense" | "income";

export interface CaptureInitialValues {
  id?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  source?: string;
  date?: string;
  description?: string;
}

interface CaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "create" adds a new movement; "edit" patches initialValues.id. */
  mode?: "create" | "edit";
  /** Initial segment; edit mode locks it. */
  kind?: CaptureKind;
  initialValues?: CaptureInitialValues;
  onSaved?: () => void;
}

interface Suggestion {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * The unified capture surface: one bottom sheet (mobile) / side sheet
 * (desktop) for adding and editing expenses and incomes. Amount-first,
 * with as-you-type category suggestions for expenses.
 */
export function CaptureSheet({
  open,
  onOpenChange,
  mode = "create",
  kind: initialKind = "expense",
  initialValues,
  onSaved,
}: CaptureSheetProps) {
  const { t, tc } = useLocale();
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();
  const { addExpense, addIncome, updateExpense, updateIncome, saving } =
    useCapture();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isEdit = mode === "edit";

  const amountRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const [kind, setKind] = useState<CaptureKind>(initialKind);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  function seedForm() {
    const defaults = readCaptureDefaults();
    setKind(initialKind);
    setSuggestion(null);
    setCategoryTouched(isEdit);
    setAmount(
      initialValues?.amount !== undefined ? String(initialValues.amount) : ""
    );
    setDescription(initialValues?.description ?? "");
    setSource(initialValues?.source ?? "");
    setCategoryId(initialValues?.categoryId ?? defaults.categoryId ?? "");
    setCurrency(initialValues?.currency ?? defaults.currency ?? baseCurrency);
    setDate(initialValues?.date ?? format(new Date(), "yyyy-MM-dd"));
  }

  // Seed only when the sheet opens (false → true). Do NOT re-seed when
  // baseCurrency loads later — that was wiping COP mid-entry back to EUR.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      seedForm();
      const timer = setTimeout(() => amountRef.current?.focus(), 250);
      wasOpenRef.current = true;
      return () => clearTimeout(timer);
    }
    if (!open) {
      wasOpenRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open-edge only
  }, [open]);

  // Debounced merchant → category suggestion (expenses only).
  useEffect(() => {
    if (!open || kind !== "expense" || description.trim().length < 3) {
      setSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await authorizedFetch<{ suggestion: Suggestion | null }>(
          `/api/categorization/suggest?q=${encodeURIComponent(description.trim())}`
        );
        setSuggestion(result.suggestion);
        if (result.suggestion && !categoryTouched) {
          setCategoryId(result.suggestion.categoryId);
        }
      } catch {
        // Suggestions are best-effort
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [description, open, kind, categoryTouched]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );

  // Base UI Select renders the raw value unless items (or a Value children
  // formatter) supplies labels — without this the trigger shows a UUID.
  const categoryItems = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: tc(category.name),
      })),
    [categories, tc]
  );

  const currencyItems = useMemo(
    () => CURRENCIES.map((item) => ({ value: item.code, label: item.code })),
    []
  );

  const parsedAmount = parseDecimalInput(amount);
  const amountValid =
    typeof parsedAmount === "number" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;
  const canSubmit =
    amountValid &&
    !saving &&
    (kind === "expense"
      ? Boolean(selectedCategory)
      : source.trim().length > 0);

  async function persistMovement() {
    const numericAmount = parsedAmount as number;
    const trimmedDescription = description.trim();
    // Snapshot currency before any await — never trust state after close.
    const movementCurrency = currency;

    if (kind === "expense" && selectedCategory) {
      writeCaptureDefaults({
        categoryId: selectedCategory.id,
        currency: movementCurrency,
      });
      if (isEdit && initialValues?.id) {
        await updateExpense(initialValues.id, {
          amount: numericAmount,
          currency: movementCurrency,
          category_id: selectedCategory.id,
          date,
          description: trimmedDescription || null,
        });
      } else {
        await addExpense(
          {
            amount: numericAmount,
            currency: movementCurrency,
            category_id: selectedCategory.id,
            date,
            description: trimmedDescription || undefined,
          },
          selectedCategory
        );
      }
      return;
    }

    if (kind === "income") {
      writeCaptureDefaults({ currency: movementCurrency });
      if (isEdit && initialValues?.id) {
        await updateIncome(initialValues.id, {
          amount: numericAmount,
          currency: movementCurrency,
          source: source.trim(),
          date,
          description: trimmedDescription || null,
        });
      } else {
        await addIncome({
          amount: numericAmount,
          currency: movementCurrency,
          source: source.trim(),
          date,
          description: trimmedDescription || undefined,
        });
      }
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await persistMovement();
      onSaved?.();
      onOpenChange(false);
    } catch {
      // Toast is owned by useCapture — keep the sheet open so nothing is lost.
    }
  }

  async function handleSaveAndAddAnother() {
    if (!canSubmit || isEdit) return;

    try {
      await persistMovement();
      onSaved?.();
      // Keep kind + currency; clear amount/description for the next entry.
      setAmount("");
      setDescription("");
      setSuggestion(null);
      if (kind === "income") {
        // Keep source — same paycheck often repeats.
      } else {
        // Keep category from last expense (already in defaults).
      }
      setTimeout(() => amountRef.current?.focus(), 50);
    } catch {
      // Keep sheet open with current values.
    }
  }

  const title = isEdit
    ? kind === "expense"
      ? t("Edit expense", "Editar gasto")
      : t("Edit income", "Editar ingreso")
    : t("Add movement", "Añadir movimiento");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="shrink-0 px-5 pb-3 pt-1">
          <SheetTitle className="text-heading">{title}</SheetTitle>
        </SheetHeader>

        {!isEdit && (
          <div
            role="tablist"
            aria-label={t("Movement type", "Tipo de movimiento")}
            className="mx-5 mb-4 grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-secondary p-1"
          >
            {(
              [
                ["expense", t("Expense", "Gasto")],
                ["income", t("Income", "Ingreso")],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "rounded-md py-2 text-body font-medium transition-colors",
                  kind === value
                    ? "bg-background text-foreground shadow-1"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="capture-amount">{t("Amount", "Importe")}</Label>
              <div className="flex gap-2">
                <Input
                  id="capture-amount"
                  ref={amountRef}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={amount}
                  onChange={(event) =>
                    setAmount(normalizeDecimalInput(event.target.value))
                  }
                  className={cn(
                    "h-12 min-w-0 flex-1 font-mono text-xl tabular-nums",
                    kind === "expense" ? "text-negative" : "text-positive"
                  )}
                />
                <Select
                  value={currency}
                  onValueChange={(value) => {
                    if (value) setCurrency(value);
                  }}
                  items={currencyItems}
                >
                  <SelectTrigger
                    aria-label={t("Currency", "Moneda")}
                    className="h-12 w-24 shrink-0 font-mono text-sm"
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

            {kind === "income" && (
              <div className="space-y-1.5">
                <Label htmlFor="capture-source">{t("Source", "Fuente")}</Label>
                <Input
                  id="capture-source"
                  autoComplete="off"
                  placeholder={t("e.g. Salary", "p. ej. Nómina")}
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="capture-description">
                {t("Description", "Descripción")}{" "}
                <span className="text-muted-foreground">
                  {t("(optional)", "(opcional)")}
                </span>
              </Label>
              <Input
                id="capture-description"
                autoComplete="off"
                placeholder={
                  kind === "expense"
                    ? t("e.g. Mercadona", "p. ej. Mercadona")
                    : t("e.g. July invoice", "p. ej. Factura de julio")
                }
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="h-11"
              />
              {kind === "expense" &&
                suggestion &&
                suggestion.categoryId === categoryId && (
                  <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    {t("Suggested:", "Sugerido:")}
                    <CategoryBadge
                      name={tc(suggestion.name)}
                      icon={suggestion.icon}
                      color={suggestion.color}
                    />
                  </p>
                )}
            </div>

            {kind === "expense" && (
              <div className="space-y-1.5">
                <Label htmlFor="capture-category">
                  {t("Category", "Categoría")}
                </Label>
                <Select
                  value={categoryId || null}
                  onValueChange={(value) => {
                    setCategoryId(value ?? "");
                    setCategoryTouched(true);
                  }}
                  items={categoryItems}
                >
                  <SelectTrigger
                    id="capture-category"
                    className="h-11 w-full min-w-0"
                  >
                    <SelectValue placeholder={t("Select", "Selecciona")}>
                      {selectedCategory
                        ? tc(selectedCategory.name)
                        : undefined}
                    </SelectValue>
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
            )}

            <div className="space-y-1.5">
              <Label htmlFor="capture-date">{t("Date", "Fecha")}</Label>
              <Input
                id="capture-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 w-full"
              />
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-border bg-popover/96 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full text-base"
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : isEdit ? (
                t("Save changes", "Guardar cambios")
              ) : kind === "expense" ? (
                t("Add expense", "Añadir gasto")
              ) : (
                t("Add income", "Añadir ingreso")
              )}
            </Button>
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                disabled={!canSubmit}
                className="h-11 w-full"
                onClick={() => void handleSaveAndAddAnother()}
              >
                {t("Save & add another", "Guardar y añadir otro")}
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
