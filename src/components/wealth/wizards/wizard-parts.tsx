"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export interface TypeOption<Value extends string> {
  value: Value;
  icon: LucideIcon;
  en: string;
  es: string;
  blurbEn: string;
  blurbEs: string;
}

/**
 * Step 1 of every Patrimonio wizard: a radiogroup of large choice cards.
 * The accent is the category's, so the branch a user picks carries its colour
 * through the rest of the flow.
 */
export function TypeStep<Value extends string>({
  options,
  value,
  onChange,
  accent,
  label,
}: {
  options: TypeOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  accent: string;
  label: string;
}) {
  const { t } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className="rounded-xl bg-card p-4 text-left ring-1 ring-border transition-shadow hover:shadow-2"
            style={active ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
          >
            <span
              aria-hidden
              className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accent}1f`, color: accent }}
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
  );
}

/** A `<dt>/<dd>` pair for a wizard's review table. */
export function ReviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd
        className={cn("truncate text-body font-medium")}
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

/** The bordered list every review step wraps its rows in. */
export function ReviewTable({ children }: { children: React.ReactNode }) {
  return (
    <dl className="divide-y divide-border/60 rounded-xl ring-1 ring-border/60">
      {children}
    </dl>
  );
}
