"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddSheet } from "@/components/expenses/quick-add-sheet";
import { useLocale } from "@/providers/locale-provider";

/**
 * Global floating quick-add button. Sits above the mobile bottom nav
 * (h-[4.75rem], z-50) at z-40; sheets/dialogs render above both.
 */
export function QuickAddFab() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.75rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_20px_45px_-18px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_55px_-20px_rgba(0,0,0,0.6)] active:translate-y-px md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">{t("Quick add expense", "Añadir gasto rápido")}</span>
      </button>
      <QuickAddSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
