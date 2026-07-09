"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Zap } from "lucide-react";
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
import { useQuickAddExpense } from "@/hooks/use-quick-add-expense";
import {
  readCaptureDefaults,
  writeCaptureDefaults,
} from "@/lib/capture/defaults";
import { CURRENCIES } from "@/lib/constants";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { normalizeDecimalInput, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Suggestion {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();
  const { quickAdd, saving } = useQuickAddExpense();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  // Smart defaults on open: last-used category + currency, today's date
  useEffect(() => {
    if (!open) return;
    const defaults = readCaptureDefaults();
    setAmount("");
    setDescription("");
    setSuggestion(null);
    setCategoryTouched(false);
    setCategoryId(defaults.categoryId ?? "");
    setCurrency(defaults.currency ?? baseCurrency);
    setDate(format(new Date(), "yyyy-MM-dd"));
    // Autofocus lands after the sheet animation
    const timer = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [open, baseCurrency]);

  // Debounced merchant → category suggestion while typing the description
  useEffect(() => {
    if (!open || description.trim().length < 3) {
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
  }, [description, open, categoryTouched]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const parsedAmount = parseDecimalInput(amount);
  const canSubmit =
    typeof parsedAmount === "number" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    Boolean(selectedCategory) &&
    !saving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !selectedCategory) return;

    writeCaptureDefaults({ categoryId: selectedCategory.id, currency });
    onOpenChange(false);

    await quickAdd(
      {
        amount: parsedAmount as number,
        currency,
        category_id: selectedCategory.id,
        date,
        description: description.trim() || undefined,
      },
      selectedCategory
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-hidden border-border/80 bg-popover/96 p-0 shadow-[0_34px_100px_-56px_rgba(0,0,0,0.95)] data-[side=bottom]:rounded-t-[2rem] data-[side=bottom]:border-t sm:max-w-[420px]"
      >
        <SheetHeader className="border-b border-border/70 bg-background/90 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-4 w-4" />
            {t("Quick add", "Añadir rápido")}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="quick-amount">{t("Amount", "Importe")}</Label>
            <div className="flex gap-2">
              <Input
                id="quick-amount"
                ref={amountRef}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                value={amount}
                onChange={(event) =>
                  setAmount(normalizeDecimalInput(event.target.value))
                }
                className="h-12 flex-1 font-mono text-xl tabular-nums"
              />
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value ?? baseCurrency)}
              >
                <SelectTrigger className="h-12 w-24 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((item) => (
                    <SelectItem key={item.code} value={item.code} className="text-sm">
                      {item.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-description">
              {t("Description", "Descripción")}{" "}
              <span className="text-muted-foreground">
                {t("(optional)", "(opcional)")}
              </span>
            </Label>
            <Input
              id="quick-description"
              autoComplete="off"
              placeholder={t("e.g. Mercadona", "p. ej. Mercadona")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-11"
            />
            {suggestion && suggestion.categoryId === categoryId && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {t("Suggested:", "Sugerido:")}
                <CategoryBadge
                  name={suggestion.name}
                  icon={suggestion.icon}
                  color={suggestion.color}
                />
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quick-category">
                {t("Category", "Categoría")}
              </Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value ?? "");
                  setCategoryTouched(true);
                }}
              >
                <SelectTrigger id="quick-category" className="h-11">
                  <SelectValue
                    placeholder={t("Select", "Selecciona")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="text-sm"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-date">{t("Date", "Fecha")}</Label>
              <Input
                id="quick-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full text-base"
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              t("Add expense", "Añadir gasto")
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
