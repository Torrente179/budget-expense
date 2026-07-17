"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  wealth:
    "wealth patrimonio investments inversiones savings ahorros liabilities deudas net worth",
  insights:
    "insights analytics analitica análisis trends tendencias reports calendar calendario",
  import: "import importar csv santander wise bank banco",
  review: "review revision revisión categorize categorizar inbox",
  wisdom: "wisdom sabiduria sabiduría stewardship mayordomia mayordomía",
  settings: "settings ajustes configuracion configuración perfil profile",
};

/** ⌘K quick navigation. Trigger button lives in the desktop topbar. */
export function CommandMenu() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = [
    { heading: t("Sections", "Secciones"), items: PRIMARY_NAV },
    { heading: t("More", "Más"), items: SECONDARY_NAV },
  ];

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 rounded-full border border-border bg-secondary/80 px-3 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="text-caption">{t("Search", "Buscar")}</span>
        <kbd className="rounded-md border border-border bg-background px-1.5 font-mono text-label text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Quick navigation", "Navegación rápida")}
        description={t(
          "Type a destination and press enter",
          "Escribe un destino y presiona enter"
        )}
      >
        <Command>
          <CommandInput
            placeholder={t("Go to…", "Ir a…")}
          />
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
                      setOpen(false);
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
    </>
  );
}
