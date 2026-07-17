"use client";

import { cn, type AppLocale } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

interface LanguageSwitchProps {
  compact?: boolean;
  className?: string;
}

/**
 * Segmented ENG/ESP control. Avoids Select-inside-Sheet portal issues that
 * made Spanish unreachable on mobile.
 */
export function LanguageSwitch({
  compact = false,
  className,
}: LanguageSwitchProps) {
  const { locale, setLocale, t } = useLocale();

  const options: { value: AppLocale; compactLabel: string; label: string }[] = [
    {
      value: "en",
      compactLabel: "ENG",
      label: t("English", "Inglés"),
    },
    {
      value: "es",
      compactLabel: "ESP",
      label: t("Spanish", "Español"),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t("Language", "Idioma")}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary/80 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option.value)}
            className={cn(
              "rounded-full px-2.5 font-medium uppercase tracking-widest transition-colors",
              compact ? "h-7 text-[0.65rem]" : "h-8 px-3 text-xs",
              active
                ? "bg-background text-foreground shadow-1"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {compact ? option.compactLabel : option.label}
          </button>
        );
      })}
    </div>
  );
}
