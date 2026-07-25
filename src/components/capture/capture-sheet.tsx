"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
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
import {
  CategoryBadge,
  CategoryOption,
  CATEGORY_SELECT_CONTENT_CLASS,
} from "@/components/shared/category-badge";
import { useCategories } from "@/hooks/use-categories";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCapture } from "@/hooks/use-capture";
import {
  readCaptureDefaults,
  writeCaptureDefaults,
} from "@/lib/capture/defaults";
import { CURRENCIES } from "@/lib/constants";
import { isLoanCategoryName } from "@/lib/loans/is-loan-category";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { cn, formatCurrency, normalizeDecimalInput, parseDecimalInput } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];
type LoanPerson = Database["public"]["Tables"]["loan_people"]["Row"];

function categoryAppliesTo(
  category: { applies_to?: string | null },
  side: "expense" | "income"
) {
  const value = category.applies_to ?? "expense";
  return value === "both" || value === side;
}

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
  source?: "rule" | "history";
  confidence?: number;
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
  const { addExpense, addLoan, addIncome, updateExpense, updateIncome, saving } =
    useCapture();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isEdit = mode === "edit";

  const amountRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const [kind, setKind] = useState<CaptureKind>(initialKind);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [loanId, setLoanId] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const learnedForRef = useRef<string | null>(null);

  const { data: loansData } = useQuery({
    queryKey: queryKeys.loans,
    enabled: open,
    queryFn: () =>
      authorizedFetch<{
        loans: Loan[];
        repayments: LoanRepayment[];
        people: LoanPerson[];
      }>("/api/loans"),
  });

  function seedForm() {
    const defaults = readCaptureDefaults();
    setKind(initialKind);
    setSuggestion(null);
    setSuggestions([]);
    learnedForRef.current = null;
    setCategoryTouched(isEdit);
    setAmount(
      initialValues?.amount !== undefined ? String(initialValues.amount) : ""
    );
    setDescription(initialValues?.description ?? "");
    setBorrowerName("");
    setLoanId("");
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
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await authorizedFetch<{
          suggestion: Suggestion | null;
          suggestions?: Suggestion[];
        }>(
          `/api/categorization/suggest?q=${encodeURIComponent(description.trim())}`
        );
        const next = result.suggestions?.length
          ? result.suggestions
          : result.suggestion
            ? [result.suggestion]
            : [];
        setSuggestions(next);
        setSuggestion(next[0] ?? null);
        if (next[0] && !categoryTouched) {
          setCategoryId(next[0].categoryId);
        }
      } catch {
        // Suggestions are best-effort
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [description, open, kind, categoryTouched]);

  function rememberCategory(categoryIdValue: string) {
    const trimmed = description.trim();
    if (kind !== "expense" || trimmed.length < 3 || !categoryIdValue) return;
    const learnKey = `${trimmed.toLowerCase()}::${categoryIdValue}`;
    if (learnedForRef.current === learnKey) return;
    // Only learn when the user picks something other than the top suggestion.
    if (suggestion && suggestion.categoryId === categoryIdValue) return;
    learnedForRef.current = learnKey;
    void authorizedFetch("/api/categorization/rules", {
      method: "POST",
      body: JSON.stringify({
        pattern: trimmed,
        categoryId: categoryIdValue,
      }),
    }).catch(() => {
      // Learning is best-effort
    });
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const sideCategories = useMemo(
    () =>
      categories.filter((category) =>
        categoryAppliesTo(category, kind === "income" ? "income" : "expense")
      ),
    [categories, kind]
  );

  const isLoanExpense =
    kind === "expense" &&
    selectedCategory !== null &&
    isLoanCategoryName(selectedCategory.name);

  const isLoanIncome =
    kind === "income" &&
    selectedCategory !== null &&
    isLoanCategoryName(selectedCategory.name);

  const openLoans = useMemo(() => {
    if (!loansData) return [];
    return loansData.loans
      .filter((loan) => loan.is_active)
      .map((loan) => {
        const repaid = loansData.repayments
          .filter((repayment) => repayment.loan_id === loan.id)
          .reduce((sum, repayment) => sum + Number(repayment.amount), 0);
        const outstanding = Math.max(Number(loan.principal) - repaid, 0);
        return { loan, outstanding };
      })
      .filter((row) => row.outstanding > 0);
  }, [loansData]);

  const peopleNames = useMemo(
    () => (loansData?.people ?? []).map((person) => person.name),
    [loansData?.people]
  );

  // Base UI Select renders the raw value unless items (or a Value children
  // formatter) supplies labels — without this the trigger shows a UUID.
  const categoryItems = useMemo(
    () =>
      sideCategories.map((category) => ({
        value: category.id,
        label: tc(category.name),
      })),
    [sideCategories, tc]
  );

  const currencyItems = useMemo(
    () => CURRENCIES.map((item) => ({ value: item.code, label: item.code })),
    []
  );

  const loanItems = useMemo(
    () =>
      openLoans.map(({ loan, outstanding }) => ({
        value: loan.id,
        label: `${loan.borrower_name} · ${formatCurrency(outstanding, loan.currency)}`,
      })),
    [openLoans]
  );

  const selectedOpenLoan = openLoans.find((row) => row.loan.id === loanId);

  const parsedAmount = parseDecimalInput(amount);
  const amountValid =
    typeof parsedAmount === "number" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;
  const canSubmit =
    amountValid &&
    !saving &&
    (kind === "expense"
      ? Boolean(selectedCategory) &&
        (!isLoanExpense || isEdit || borrowerName.trim().length > 0)
      : isLoanIncome
        ? Boolean(selectedCategory) && Boolean(loanId)
        : Boolean(selectedCategory));

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
        if (isLoanExpense && borrowerName.trim()) {
          try {
            await authorizedFetch("/api/loans", {
              method: "POST",
              body: JSON.stringify({
                borrower_name: borrowerName.trim(),
                principal: numericAmount,
                currency: movementCurrency,
                lent_date: date,
                notes: trimmedDescription || null,
                create_movement: false,
                expense_id: initialValues.id,
              }),
            });
          } catch {
            // 409 = already linked; ignore. Other errors still leave the expense saved.
          }
        }
      } else if (isLoanExpense) {
        const name = borrowerName.trim();
        await addLoan({
          borrower_name: name,
          amount: numericAmount,
          currency: movementCurrency,
          date,
          description: trimmedDescription || undefined,
          movement_description: t(`Loan to ${name}`, `Préstamo a ${name}`),
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

    if (kind === "income" && selectedCategory) {
      writeCaptureDefaults({ currency: movementCurrency });
      const loanBorrower = selectedOpenLoan?.loan.borrower_name;
      const incomeSource = isLoanIncome
        ? t(
            `Loan repayment — ${loanBorrower}`,
            `Cobro de préstamo — ${loanBorrower}`
          )
        : tc(selectedCategory.name);

      if (isEdit && initialValues?.id) {
        await updateIncome(initialValues.id, {
          amount: numericAmount,
          currency: movementCurrency,
          source: incomeSource,
          date,
          description: trimmedDescription || null,
          category_id: selectedCategory.id,
        });
      } else {
        await addIncome({
          amount: numericAmount,
          currency: movementCurrency,
          source: incomeSource,
          date,
          description: trimmedDescription || undefined,
          category_id: selectedCategory.id,
          loan_id: isLoanIncome ? loanId : undefined,
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
      setBorrowerName("");
      setLoanId("");
      setSuggestion(null);
      // Keep category from last entry (already in defaults for expenses).
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
                onClick={() => {
                  setKind(value);
                  setCategoryId("");
                  setCategoryTouched(false);
                  setLoanId("");
                  setBorrowerName("");
                }}
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
                    kind === "expense" ? "text-foreground" : "text-positive"
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
              {kind === "expense" && suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-caption text-muted-foreground">
                    {t("Suggested:", "Sugerido:")}
                  </span>
                  {suggestions.map((item, index) => {
                    const selected = item.categoryId === categoryId;
                    return (
                      <button
                        key={`${item.categoryId}-${index}`}
                        type="button"
                        onClick={() => {
                          setCategoryId(item.categoryId);
                          setCategoryTouched(true);
                          setLoanId("");
                          if (index > 0) rememberCategory(item.categoryId);
                        }}
                        className={cn(
                          "rounded-full border px-2 py-0.5 transition-colors",
                          selected
                            ? "border-foreground/30 bg-secondary"
                            : "border-border/70 bg-background hover:bg-secondary/70"
                        )}
                      >
                        <CategoryBadge
                          name={tc(item.name)}
                          icon={item.icon}
                          color={item.color}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capture-category">
                {t("Category", "Categoría")}
              </Label>
              <Select
                value={categoryId || null}
                onValueChange={(value) => {
                  const next = value ?? "";
                  setCategoryId(next);
                  setCategoryTouched(true);
                  setLoanId("");
                  rememberCategory(next);
                }}
                items={categoryItems}
              >
                <SelectTrigger
                  id="capture-category"
                  className="h-11 w-full min-w-0 border-border/80 bg-secondary/40"
                >
                  <SelectValue placeholder={t("Select", "Selecciona")}>
                    {selectedCategory ? (
                      <CategoryOption
                        name={tc(selectedCategory.name)}
                        icon={selectedCategory.icon}
                        color={selectedCategory.color}
                      />
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={CATEGORY_SELECT_CONTENT_CLASS}>
                  {sideCategories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="text-sm"
                    >
                      <CategoryOption
                        name={tc(category.name)}
                        icon={category.icon}
                        color={category.color}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoanExpense && (
              <div className="space-y-1.5">
                <Label htmlFor="capture-borrower">
                  {t("Borrower", "Persona")}
                  {!isEdit && (
                    <span className="text-muted-foreground"> *</span>
                  )}
                </Label>
                <Input
                  id="capture-borrower"
                  list="capture-loan-people"
                  autoComplete="off"
                  placeholder={t("e.g. Ana", "p. ej. Ana")}
                  value={borrowerName}
                  onChange={(event) => setBorrowerName(event.target.value)}
                  className="h-11"
                />
                <datalist id="capture-loan-people">
                  {peopleNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Also tracked under Wealth → Loans.",
                    "También se registra en Patrimonio → Préstamos."
                  )}
                </p>
              </div>
            )}

            {isLoanIncome && (
              <div className="space-y-1.5">
                <Label htmlFor="capture-loan-person">
                  {t("Person / open loan", "Persona / préstamo abierto")}
                </Label>
                <Select
                  value={loanId || null}
                  onValueChange={(value) => setLoanId(value ?? "")}
                  items={loanItems}
                >
                  <SelectTrigger
                    id="capture-loan-person"
                    className="h-11 w-full"
                  >
                    <SelectValue
                      placeholder={t(
                        "Select who repaid you",
                        "Elige quién te devolvió"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {openLoans.map(({ loan, outstanding }) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.borrower_name} ·{" "}
                        {formatCurrency(outstanding, loan.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Records income and reduces what they owe in Wealth → Loans.",
                    "Registra el ingreso y reduce lo que te deben en Patrimonio → Préstamos."
                  )}
                </p>
                {openLoans.length === 0 && (
                  <p className="text-caption text-destructive">
                    {t(
                      "No open loans to repay. Add a loan first.",
                      "No hay préstamos abiertos. Primero añade un préstamo."
                    )}
                  </p>
                )}
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
