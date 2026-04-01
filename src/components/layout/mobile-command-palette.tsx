"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CandlestickChart,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Search,
  Settings,
  TrendingUp,
} from "lucide-react";
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
import { TotalNavIcon } from "./total-nav-icon";

export function MobileCommandPalette() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const commands = [
    {
      href: "/dashboard",
      label: t("Dashboard", "Panel"),
      keywords: "dashboard panel home inicio",
      icon: LayoutDashboard,
    },
    {
      href: "/available-now",
      label: t("Total", "Total"),
      keywords: "total disponible ahora balance ingresos gastos neto",
      icon: TotalNavIcon,
    },
    {
      href: "/expenses",
      label: t("Expenses", "Gastos"),
      keywords: "expenses gastos gasto egreso",
      icon: Receipt,
    },
    {
      href: "/incomes",
      label: t("Incomes", "Ingresos"),
      keywords: "incomes ingresos ganancias salary freelance",
      icon: TrendingUp,
    },
    {
      href: "/budgets",
      label: t("Budgets", "Presupuestos"),
      keywords: "budgets presupuestos sobres",
      icon: PiggyBank,
    },
    {
      href: "/investments",
      label: t("Investments", "Inversiones"),
      keywords: "investments inversiones bolsa crypto",
      icon: CandlestickChart,
    },
    {
      href: "/settings",
      label: t("Settings", "Ajustes"),
      keywords: "settings ajustes configuración",
      icon: Settings,
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-2xl border border-border bg-secondary/80 md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">{t("Search", "Buscar")}</span>
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
          <CommandInput placeholder={t("Type: total, gastos, ingresos...", "Escribe: total, gastos, ingresos...")} />
          <CommandList>
            <CommandEmpty>{t("No results found", "No se encontraron resultados")}</CommandEmpty>
            <CommandGroup>
              {commands.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${item.keywords}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
