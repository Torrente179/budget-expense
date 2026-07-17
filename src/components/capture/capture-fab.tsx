"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CaptureSheet } from "@/components/capture/capture-sheet";
import { useLocale } from "@/providers/locale-provider";

/**
 * Global floating capture button. Sits above the mobile tab bar at z-40,
 * bottom-right (thumb zone); sheets/dialogs render above it.
 */
export function CaptureFab() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-3 transition-all hover:-translate-y-0.5 active:translate-y-px md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">
          {t("Add movement", "Añadir movimiento")}
        </span>
      </button>
      <CaptureSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
