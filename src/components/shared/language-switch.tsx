"use client";

import { Check, Languages } from "lucide-react";
import { cn, type AppLocale } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/ui/button";

const LOCALE_LABELS: Record<
  AppLocale,
  { short: string; en: string; es: string }
> = {
  en: { short: "EN", en: "English", es: "Inglés" },
  es: { short: "ES", en: "Spanish", es: "Español" },
};

function localeDisplayName(code: AppLocale, active: AppLocale) {
  const labels = LOCALE_LABELS[code];
  return active === "es" ? labels.es : labels.en;
}

/**
 * Tiny chrome control: one tappable chip showing the active language.
 * Two locales → tap toggles. Stays out of the way of headers/actions.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const next: AppLocale = locale === "en" ? "es" : "en";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-11 gap-1.5 rounded-full border border-border bg-secondary/80 px-2.5 font-mono text-xs font-medium tracking-wide md:h-9",
        className
      )}
      aria-label={t(
        `Language: ${localeDisplayName(locale, "en")}. Tap to switch to ${localeDisplayName(next, "en")}`,
        `Idioma: ${localeDisplayName(locale, "es")}. Toca para cambiar a ${localeDisplayName(next, "es")}`
      )}
      onClick={() => setLocale(next)}
    >
      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{LOCALE_LABELS[locale].short}</span>
    </Button>
  );
}

/**
 * Account-sheet preference row — looks like native settings, no header chrome.
 * Tap toggles EN ↔ ES.
 */
export function LanguagePreferenceRow({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const next: AppLocale = locale === "en" ? "es" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-accent",
        className
      )}
    >
      <Languages className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-body font-medium">
        {t("Language", "Idioma")}
      </span>
      <span className="text-body text-muted-foreground">
        {localeDisplayName(locale, locale)}
      </span>
    </button>
  );
}

/**
 * Settings-style radio list — the canonical place to choose language.
 */
export function LanguagePreferenceList({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const options: AppLocale[] = ["en", "es"];

  return (
    <div
      role="radiogroup"
      aria-label={t("Language", "Idioma")}
      className={cn("overflow-hidden rounded-xl border border-border", className)}
    >
      {options.map((code, index) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLocale(code)}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent",
              index > 0 && "border-t border-border",
              selected && "bg-secondary/40"
            )}
          >
            <span className="min-w-0 flex-1 text-body font-medium">
              {localeDisplayName(code, locale)}
            </span>
            {selected && (
              <Check className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
