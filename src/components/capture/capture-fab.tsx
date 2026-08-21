"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

const CaptureSheet = dynamic(
  () =>
    import("@/components/capture/capture-sheet").then((mod) => mod.CaptureSheet),
  { ssr: false }
);

/**
 * Global floating capture button — coral circle, bottom-right (thumb zone),
 * sitting above the tab pill at z-40; sheets/dialogs render above it. Flat,
 * with a coral glow rather than a drop shadow.
 * Keep the sheet mounted while open so an in-flight save is not killed.
 */
export function CaptureFabButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-ink up-fab-glow transition-transform duration-[var(--motion-press)] active:scale-[0.98] md:bottom-8 md:right-8",
        className
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">
        {t("Add movement", "Añadir movimiento")}
      </span>
    </button>
  );
}

export function CaptureFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CaptureFabButton onClick={() => setOpen(true)} />
      {open && <CaptureSheet open={open} onOpenChange={setOpen} />}
    </>
  );
}
