"use client";

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/theme";
import { useLocale } from "@/providers/locale-provider";
import { useThemePreference } from "@/providers/theme-provider";

const THEME_OPTIONS: {
  value: ThemePreference;
  icon: LucideIcon;
  label: { en: string; es: string };
}[] = [
  { value: "light", icon: Sun, label: { en: "Light", es: "Claro" } },
  { value: "dark", icon: Moon, label: { en: "Dark", es: "Oscuro" } },
  {
    value: "system",
    icon: Monitor,
    label: { en: "Match device", es: "Igual que el dispositivo" },
  },
];

/** Account-sheet preference row. Tap steps Light → Dark → Match device. */
export function ThemePreferenceRow({ className }: { className?: string }) {
  const { preference, setPreference } = useThemePreference();
  const { t } = useLocale();
  const index = THEME_OPTIONS.findIndex((option) => option.value === preference);
  const current = THEME_OPTIONS[index] ?? THEME_OPTIONS[1];
  const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];

  return (
    <button
      type="button"
      onClick={() => setPreference(next.value)}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-accent",
        className
      )}
    >
      <current.icon className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-body font-medium">
        {t("Appearance", "Apariencia")}
      </span>
      <span className="text-body text-muted-foreground">
        {t(current.label.en, current.label.es)}
      </span>
    </button>
  );
}

/** Settings radio list: the canonical place to choose the appearance. */
export function ThemePreferenceList({ className }: { className?: string }) {
  const { preference, setPreference } = useThemePreference();
  const { t } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label={t("Appearance", "Apariencia")}
      className={cn("overflow-hidden rounded-xl border border-border", className)}
    >
      {THEME_OPTIONS.map((option, index) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(option.value)}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent",
              index > 0 && "border-t border-border",
              selected && "bg-secondary/40"
            )}
          >
            <option.icon
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-body font-medium">
              {t(option.label.en, option.label.es)}
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
