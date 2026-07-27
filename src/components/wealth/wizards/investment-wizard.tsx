"use client";

import { useEffect, useState } from "react";
import {
  Bitcoin,
  Briefcase,
  CandlestickChart,
  Landmark,
  Loader2,
  PieChart,
  TrendingUp,
} from "lucide-react";
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
  WizardModal,
  useDiscardPanel,
  type WizardStep,
} from "@/components/patterns/wizard-modal";
import { FinancialImpact } from "@/components/wealth/financial-impact";
import {
  ReviewRow,
  ReviewTable,
  TypeStep,
  type TypeOption,
} from "@/components/wealth/wizards/wizard-parts";
import { CURRENCIES } from "@/lib/constants";
import { PALETTE } from "@/lib/palette";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { resolveFinancialImpact } from "@/lib/wealth/transaction-effects";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

type Step = "type" | "config" | "review";
type InvestmentKind =
  | "brokerage"
  | "fund"
  | "stocks"
  | "crypto"
  | "pension"
  | "other";

const OPTIONS: TypeOption<InvestmentKind>[] = [
  {
    value: "brokerage",
    icon: Briefcase,
    en: "Investment account",
    es: "Cuenta de inversión",
    blurbEn: "A broker account valued as a whole.",
    blurbEs: "Una cuenta de broker valorada en conjunto.",
  },
  {
    value: "fund",
    icon: PieChart,
    en: "Fund or ETF",
    es: "Fondo o ETF",
    blurbEn: "Index funds, ETFs, managed portfolios.",
    blurbEs: "Fondos indexados, ETFs, carteras gestionadas.",
  },
  {
    value: "stocks",
    icon: CandlestickChart,
    en: "Shares",
    es: "Acciones",
    blurbEn: "Individual company shares.",
    blurbEs: "Acciones de empresas concretas.",
  },
  {
    value: "crypto",
    icon: Bitcoin,
    en: "Cryptocurrency",
    es: "Criptomoneda",
    blurbEn: "Bitcoin, Ethereum and the rest.",
    blurbEs: "Bitcoin, Ethereum y demás.",
  },
  {
    value: "pension",
    icon: Landmark,
    en: "Pension plan",
    es: "Plan de pensiones",
    blurbEn: "Retirement pots you cannot draw on yet.",
    blurbEs: "Planes de jubilación que aún no puedes tocar.",
  },
  {
    value: "other",
    icon: TrendingUp,
    en: "Other investment",
    es: "Otra inversión",
    blurbEn: "Anything else whose value can move.",
    blurbEs: "Cualquier otra cosa cuyo valor pueda moverse.",
  },
];

export interface InvestmentWizardValues {
  kind: InvestmentKind;
  name: string;
  institution: string | null;
  currency: string;
  current_value: number;
  contributed_cost: number;
  reference: string | null;
}

interface InvestmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvestmentWizardValues) => Promise<unknown>;
}

/**
 * Añadir inversión — for holdings the user values by hand.
 *
 * Positions with a real trade history belong in the brokerage flow (Orders),
 * where market value comes from FIFO lots and live quotes. This is the other
 * kind: "my pension is worth X and I put in Y".
 *
 * Step 3's job is to say that an unrealized gain is not income.
 */
export function InvestmentWizard({
  open,
  onOpenChange,
  onSubmit,
}: InvestmentWizardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const [step, setStep] = useState<Step>("type");
  const [kind, setKind] = useState<InvestmentKind | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [value, setValue] = useState("");
  const [cost, setCost] = useState("");
  const [reference, setReference] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setKind(null);
    setName("");
    setInstitution("");
    setValue("");
    setCost("");
    setReference("");
    setCurrency(baseCurrency);
    setConfirmDiscard(false);
  }, [open, baseCurrency]);

  const parsedValue = parseDecimalInput(value);
  const parsedCost = parseDecimalInput(cost);
  const isDirty = kind !== null || name.trim() !== "" || value.trim() !== "";
  const configValid = name.trim().length > 0 && parsedValue !== null;

  const gain =
    parsedValue !== null && parsedCost !== null ? parsedValue - parsedCost : null;
  const returnRatio =
    gain !== null && parsedCost !== null && parsedCost > 0
      ? gain / parsedCost
      : null;

  function requestClose() {
    if (submitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  }

  const discard = useDiscardPanel({
    onKeepEditing: () => setConfirmDiscard(false),
    onDiscard: () => onOpenChange(false),
  });

  const impact = resolveFinancialImpact({
    event: "opening_investment",
    amount: convert(parsedValue ?? 0, currency),
    includeInAvailable: false,
  });

  async function handleCreate() {
    if (!kind || parsedValue === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        kind,
        name: name.trim(),
        institution: institution.trim() || null,
        currency,
        current_value: parsedValue,
        contributed_cost: parsedCost ?? 0,
        reference: reference.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const steps: WizardStep<Step>[] = [
    { id: "type", label: t("Type", "Tipo") },
    { id: "config", label: t("Setup", "Configuración") },
    { id: "review", label: t("Review", "Revisar") },
  ];

  const selected = OPTIONS.find((option) => option.value === kind);
  const gainColor =
    gain === null || gain === 0
      ? undefined
      : gain > 0
        ? PALETTE.cashflow.income
        : PALETTE.cashflow.expense;

  const body = confirmDiscard ? (
    discard.body
  ) : step === "type" ? (
    <TypeStep
      options={OPTIONS}
      value={kind}
      onChange={setKind}
      accent={PALETTE.wealth.investments}
      label={t("Investment type", "Tipo de inversión")}
    />
  ) : step === "config" ? (
    <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-name">{t("Name", "Nombre")}</Label>
            <Input
              id="inv-wizard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Index portfolio", "Cartera indexada")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-institution">
              {t("Platform (optional)", "Plataforma (opcional)")}
            </Label>
            <Input
              id="inv-wizard-institution"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              placeholder="MyInvestor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-value">
              {t("Current value", "Valor actual")}
            </Label>
            <Input
              id="inv-wizard-value"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-cost">
              {t("Contributed cost", "Coste aportado")}
            </Label>
            <Input
              id="inv-wizard-cost"
              inputMode="decimal"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-currency">
              {t("Currency", "Moneda")}
            </Label>
            <Select
              value={currency}
              onValueChange={(next) => next && setCurrency(next)}
            >
              <SelectTrigger id="inv-wizard-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wizard-reference">
              {t("Ticker / ISIN (optional)", "Ticker / ISIN (opcional)")}
            </Label>
            <Input
              id="inv-wizard-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="IE00B4L5Y983"
            />
          </div>
        </div>

        {gain !== null && (
          <div className="flex items-baseline justify-between rounded-lg bg-secondary/50 px-3.5 py-3">
            <span className="text-body">
              {t("Unrealized gain", "Ganancia no realizada")}
            </span>
            <span
              className="font-mono text-body font-semibold tabular-nums"
              style={{ color: gainColor }}
            >
              {gain > 0 ? "+" : ""}
              {formatCurrency(gain, currency)}
              {returnRatio !== null
                ? ` · ${gain > 0 ? "+" : ""}${(returnRatio * 100).toFixed(2)}%`
                : ""}
            </span>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
          <p className="label-caps text-muted-foreground">
            {t("Preview", "Vista previa")}
          </p>
          <div className="mt-3 space-y-1">
            <p className="truncate text-body font-medium">
              {name.trim() || t("New investment", "Nueva inversión")}
            </p>
            <p className="text-caption text-muted-foreground">
              {selected ? t(selected.en, selected.es) : ""}
            </p>
            <p className="pt-1 font-mono text-title font-semibold tabular-nums">
              {formatCurrency(parsedValue ?? 0, currency)}
            </p>
            <p className="text-caption text-muted-foreground">
              {t("Contributed", "Aportado")}{" "}
              {formatCurrency(parsedCost ?? 0, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <ReviewTable>
        <ReviewRow
          label={t("Type", "Tipo")}
          value={selected ? t(selected.en, selected.es) : "—"}
        />
        <ReviewRow label={t("Name", "Nombre")} value={name.trim()} />
        <ReviewRow
          label={t("Current value", "Valor actual")}
          value={formatCurrency(parsedValue ?? 0, currency)}
        />
        <ReviewRow
          label={t("Contributed cost", "Capital aportado")}
          value={formatCurrency(parsedCost ?? 0, currency)}
        />
        {gain !== null && (
          <ReviewRow
            label={t("Unrealized gain", "Ganancia no realizada")}
            value={`${gain > 0 ? "+" : ""}${formatCurrency(gain, currency)}`}
            tone={gainColor}
          />
        )}
      </ReviewTable>

      <FinancialImpact impact={impact} />

      <p className="text-caption text-muted-foreground">
        {t(
          "Unrealized gains raise your net worth but are not income — they only become real money when you sell.",
          "Las ganancias no realizadas suben tu patrimonio pero no son ingresos — solo se vuelven dinero real cuando vendes."
        )}
      </p>
    </div>
  );

  const footer = confirmDiscard ? (
    discard.footer
  ) : (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          step === "type"
            ? requestClose()
            : setStep(step === "review" ? "config" : "type")
        }
      >
        {step === "type" ? t("Cancel", "Cancelar") : t("Back", "Atrás")}
      </Button>

      {step === "review" ? (
        <Button onClick={handleCreate} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("Add investment", "Añadir inversión")}
        </Button>
      ) : (
        <Button
          onClick={() => setStep(step === "type" ? "config" : "review")}
          disabled={step === "type" ? kind === null : !configValid}
        >
          {t("Continue", "Continuar")}
        </Button>
      )}
    </>
  );

  return (
    <WizardModal
      open={open}
      onOpenChange={requestClose}
      title={t("Add investment", "Añadir inversión")}
      description={t(
        "Record the current value of an investment.",
        "Registra el valor actual de una inversión."
      )}
      steps={steps}
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}
