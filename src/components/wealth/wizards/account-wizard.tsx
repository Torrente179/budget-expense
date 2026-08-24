"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Landmark,
  Loader2,
  PiggyBank,
  Smartphone,
  Wallet,
  type LucideIcon,
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
import { OverlapNotice } from "@/components/wealth/wizards/overlap-notice";
import { CURRENCIES } from "@/lib/constants";
import { PALETTE } from "@/lib/palette";
import { cn, formatCurrency, parseDecimalInput } from "@/lib/utils";
import { resolveFinancialImpact } from "@/lib/wealth/transaction-effects";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

type Step = "type" | "config" | "review";
type AccountKind = "checking" | "savings" | "cash" | "digital_wallet" | "other";

const KINDS: {
  value: AccountKind;
  icon: LucideIcon;
  en: string;
  es: string;
  blurbEn: string;
  blurbEs: string;
}[] = [
  {
    value: "checking",
    icon: Landmark,
    en: "Current account",
    es: "Cuenta corriente",
    blurbEn: "Where your salary lands and your bills leave from.",
    blurbEs: "Donde entra tu nómina y salen tus recibos.",
  },
  {
    value: "savings",
    icon: PiggyBank,
    en: "Savings account",
    es: "Cuenta de ahorro",
    blurbEn: "A bank account you keep money in, not a goal fund.",
    blurbEs: "Una cuenta del banco donde guardas dinero, no un fondo con meta.",
  },
  {
    value: "cash",
    icon: Banknote,
    en: "Cash",
    es: "Efectivo",
    blurbEn: "Notes and coins you actually hold.",
    blurbEs: "Billetes y monedas que tienes contigo.",
  },
  {
    value: "digital_wallet",
    icon: Smartphone,
    en: "Digital wallet",
    es: "Monedero digital",
    blurbEn: "Bizum, PayPal, Revolut and similar balances.",
    blurbEs: "Bizum, PayPal, Revolut y saldos similares.",
  },
  {
    value: "other",
    icon: Wallet,
    en: "Other account",
    es: "Otra cuenta",
    blurbEn: "Anything else holding liquid money.",
    blurbEs: "Cualquier otra cosa que guarde dinero líquido.",
  },
];

export interface AccountWizardValues {
  name: string;
  kind: AccountKind;
  institution: string | null;
  currency: string;
  opening_balance: number;
  include_in_available: boolean;
}

interface AccountWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AccountWizardValues) => Promise<unknown>;
}

/**
 * Añadir cuenta — Tipo → Configuración → Revisar.
 *
 * Step 3 states the consequence plainly: an opening balance raises assets and
 * net worth but is **not** income for the month. That is the single mistake
 * this flow exists to prevent.
 */
export function AccountWizard({
  open,
  onOpenChange,
  onSubmit,
}: AccountWizardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const [step, setStep] = useState<Step>("type");
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [includeInAvailable, setIncludeInAvailable] = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setKind(null);
    setName("");
    setInstitution("");
    setBalance("");
    setCurrency(baseCurrency);
    setIncludeInAvailable(true);
    setConfirmDiscard(false);
  }, [open, baseCurrency]);

  const parsedBalance = parseDecimalInput(balance);
  const isDirty =
    kind !== null || name.trim() !== "" || balance.trim() !== "";
  const configValid = name.trim().length > 0 && parsedBalance !== null;

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
    event: "opening_account_balance",
    amount: convert(parsedBalance ?? 0, currency),
    includeInAvailable,
  });

  async function handleCreate() {
    if (!kind || parsedBalance === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        kind,
        institution: institution.trim() || null,
        currency,
        opening_balance: parsedBalance,
        include_in_available: includeInAvailable,
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

  const selectedKind = KINDS.find((option) => option.value === kind);

  const body = confirmDiscard ? (
    discard.body
  ) : step === "type" ? (
    <div
      role="radiogroup"
      aria-label={t("Account type", "Tipo de cuenta")}
      className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6"
    >
      {KINDS.map((option) => {
        const active = kind === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setKind(option.value)}
            className={cn(
              "rounded-xl bg-card p-4 text-left ring-1 ring-border transition-colors hover:bg-accent/30"
            )}
            style={
              active
                ? {
                    boxShadow: `inset 0 0 0 2px ${PALETTE.wealth.accounts}`,
                  }
                : undefined
            }
          >
            <span
              aria-hidden
              className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${PALETTE.wealth.accounts}1f`,
                color: PALETTE.wealth.accounts,
              }}
            >
              <option.icon className="h-4 w-4" />
            </span>
            <span className="block text-body font-medium">
              {t(option.en, option.es)}
            </span>
            <span className="mt-0.5 block text-caption text-muted-foreground">
              {t(option.blurbEn, option.blurbEs)}
            </span>
          </button>
        );
      })}
    </div>
  ) : step === "config" ? (
    <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-account-name">{t("Name", "Nombre")}</Label>
            <Input
              id="wizard-account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Main account", "Cuenta principal")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-account-institution">
              {t("Institution (optional)", "Entidad (opcional)")}
            </Label>
            <Input
              id="wizard-account-institution"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              placeholder="Santander"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-account-balance">
              {t("Current balance", "Saldo actual")}
            </Label>
            <Input
              id="wizard-account-balance"
              inputMode="decimal"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-account-currency">
              {t("Currency", "Moneda")}
            </Label>
            <Select
              value={currency}
              onValueChange={(value) => value && setCurrency(value)}
            >
              <SelectTrigger id="wizard-account-currency">
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
        </div>

        <label className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3.5 py-3">
          <input
            type="checkbox"
            checked={includeInAvailable}
            onChange={(event) => setIncludeInAvailable(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block text-body font-medium">
              {t("Include in spendable money", "Incluir en dinero disponible")}
            </span>
            <span className="block text-caption text-muted-foreground">
              {includeInAvailable
                ? t(
                    "Counts as money you can spend today.",
                    "Cuenta como dinero que puedes gastar hoy."
                  )
                : t(
                    "Held back — it still counts toward net worth.",
                    "Queda reservado — sigue contando en tu patrimonio."
                  )}
            </span>
          </span>
        </label>

        {kind === "savings" && (
          <OverlapNotice
            href="/wealth/savings"
            linkLabel={t("Savings", "Ahorros")}
            message={t(
              "A savings pot with a goal belongs in",
              "Un fondo con objetivo va en"
            )}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
          <p className="label-caps text-muted-foreground">
            {t("Preview", "Vista previa")}
          </p>
          <div className="mt-3 space-y-1">
            <p className="truncate text-body font-medium">
              {name.trim() || t("New account", "Nueva cuenta")}
            </p>
            <p className="text-caption text-muted-foreground">
              {selectedKind
                ? t(selectedKind.en, selectedKind.es)
                : t("Account", "Cuenta")}
              {institution.trim() ? ` · ${institution.trim()}` : ""}
            </p>
            <p className="pt-1 font-mono text-title font-semibold tabular-nums">
              {formatCurrency(parsedBalance ?? 0, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <dl className="divide-y divide-border/60 rounded-xl ring-1 ring-border/60">
        <ReviewRow
          label={t("Type", "Tipo")}
          value={selectedKind ? t(selectedKind.en, selectedKind.es) : "—"}
        />
        <ReviewRow label={t("Name", "Nombre")} value={name.trim()} />
        {institution.trim() && (
          <ReviewRow
            label={t("Institution", "Entidad")}
            value={institution.trim()}
          />
        )}
        <ReviewRow
          label={t("Current balance", "Saldo actual")}
          value={formatCurrency(parsedBalance ?? 0, currency)}
        />
        <ReviewRow
          label={t("Spendable", "Disponible")}
          value={includeInAvailable ? t("Yes", "Sí") : t("No", "No")}
        />
      </dl>

      <FinancialImpact impact={impact} />

      <p className="text-caption text-muted-foreground">
        {t(
          "The opening balance is a starting snapshot. It will not be recorded as income for this month.",
          "El saldo inicial es una foto de partida. No se registrará como ingreso de este mes."
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
          {t("Add account", "Añadir cuenta")}
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
      title={t("Add account", "Añadir cuenta")}
      description={t(
        "Record money you already hold.",
        "Registra dinero que ya tienes."
      )}
      steps={steps}
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="truncate text-body font-medium">{value}</dd>
    </div>
  );
}
