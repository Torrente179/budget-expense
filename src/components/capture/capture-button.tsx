"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

const CaptureSheet = dynamic(
  () =>
    import("@/components/capture/capture-sheet").then((mod) => mod.CaptureSheet),
  { ssr: false }
);

const CaptureContext = createContext<(() => void) | null>(null);

/**
 * One persistent capture host across app-page transitions. The sheet stays
 * mounted while open so an in-flight save is not killed by navigation.
 */
export function CaptureProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSheet = useMemo(() => () => setOpen(true), []);

  return (
    <CaptureContext.Provider value={openSheet}>
      {children}
      {open && <CaptureSheet open={open} onOpenChange={setOpen} />}
    </CaptureContext.Provider>
  );
}

/**
 * The add-movement button: an accent circle in every screen header. It is the
 * one accent-filled control in the chrome, so it always means the same thing.
 * Pass `onClick` to drive it outside the app shell (design fixtures).
 */
export function CaptureButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { t } = useLocale();
  const openSheet = useContext(CaptureContext);

  return (
    <button
      type="button"
      onClick={onClick ?? openSheet ?? undefined}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-on-coral transition-[background-color,transform] duration-[var(--motion-press)] hover:bg-[var(--coral-deep)] active:scale-[0.96]",
        className
      )}
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
      <span className="sr-only">{t("Add movement", "Añadir movimiento")}</span>
    </button>
  );
}
