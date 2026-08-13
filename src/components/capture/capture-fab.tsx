"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

const CaptureSheet = dynamic(
  () =>
    import("@/components/capture/capture-sheet").then((mod) => mod.CaptureSheet),
  { ssr: false }
);

/**
 * Global floating capture button — Up's coral circle, bottom-right (thumb
 * zone). Flat, with a coral glow rather than a drop shadow; there is no tab
 * bar under it any more, so it sits at the normal safe-area offset.
 * Keep the sheet mounted while open so an in-flight save is not killed.
 */
export function CaptureFab() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground up-fab-glow transition-transform active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">
          {t("Add movement", "Añadir movimiento")}
        </span>
      </button>
      {open && <CaptureSheet open={open} onOpenChange={setOpen} />}
    </>
  );
}
