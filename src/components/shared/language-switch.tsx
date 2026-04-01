"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, type AppLocale } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

interface LanguageSwitchProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitch({
  compact = false,
  className,
}: LanguageSwitchProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <Select
      value={locale}
      onValueChange={(value) => value && setLocale(value as AppLocale)}
    >
      <SelectTrigger
        className={cn(
          compact
            ? "h-8 w-[92px] text-xs font-medium uppercase tracking-[0.2em]"
            : "h-9 w-[132px] text-xs",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{compact ? "ENG" : t("English", "Inglés")}</SelectItem>
        <SelectItem value="es">{compact ? "ESP" : t("Spanish", "Español")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
