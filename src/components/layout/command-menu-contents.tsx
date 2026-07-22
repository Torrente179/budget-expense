"use client";

import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLocale } from "@/providers/locale-provider";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/navigation";

const NAV_KEYWORDS: Record<string, string> = {
  home: "home inicio panel dashboard resumen overview",
  movements: "movements movimientos gastos expenses ingresos incomes ledger",
  budget: "budget budgets presupuesto presupuestos sobres envelopes plan",
  wealth: "wealth patrimonio investments inversiones savings ahorros liabilities deudas net worth",
  insights: "insights analytics analitica análisis trends tendencias reports calendar calendario",
  import: "import importar csv santander wise bank banco",
  review: "review revision revisión categorize categorizar inbox",
  wisdom: "wisdom sabiduria sabiduría stewardship mayordomia mayordomía",
  settings: "settings ajustes configuracion configuración perfil profile",
};

export function CommandMenuContents({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const groups = [
    { heading: t("Sections", "Secciones"), items: PRIMARY_NAV },
    { heading: t("More", "Más"), items: SECONDARY_NAV },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Go somewhere", "Ir a…")}
      description={t(
        "Type a destination and press enter",
        "Escribe un destino y presiona enter"
      )}
    >
      <Command>
        <CommandInput placeholder={t("Go to…", "Ir a…")} />
        <CommandList>
          <CommandEmpty>
            {t("No results found", "No se encontraron resultados")}
          </CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${t(item.label.en, item.label.es)} ${NAV_KEYWORDS[item.key] ?? ""}`}
                  onSelect={() => {
                    onOpenChange(false);
                    router.push(item.href);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.label.en, item.label.es)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
