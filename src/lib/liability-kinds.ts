export type LiabilityKind =
  | "loan"
  | "mortgage"
  | "credit_card"
  | "personal"
  | "other";

type Translate = (en: string, es: string) => string;

/** Shared bilingual labels for liability kinds (select + list display). */
export function liabilityKindOptions(t: Translate) {
  return [
    { value: "loan" as const, label: t("Loan", "Préstamo") },
    { value: "mortgage" as const, label: t("Mortgage", "Hipoteca") },
    {
      value: "credit_card" as const,
      label: t("Credit card", "Tarjeta de crédito"),
    },
    {
      value: "personal" as const,
      label: t("Personal debt", "Deuda personal"),
    },
    { value: "other" as const, label: t("Other", "Otro") },
  ];
}

export function liabilityKindLabel(kind: string, t: Translate): string {
  return (
    liabilityKindOptions(t).find((item) => item.value === kind)?.label ?? kind
  );
}
