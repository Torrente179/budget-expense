"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CircleUserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

const ProfileSheetContents = dynamic(
  () =>
    import("@/components/layout/profile-sheet-contents").then(
      (module) => module.ProfileSheetContents
    ),
  { ssr: false }
);

const ProfileSheetContext = createContext<(() => void) | null>(null);

/** One persistent host across app-page transitions. */
export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSheet = useMemo(() => () => setOpen(true), []);

  return (
    <ProfileSheetContext.Provider value={openSheet}>
      {children}
      {open && <ProfileSheetContents open={open} onOpenChange={setOpen} />}
    </ProfileSheetContext.Provider>
  );
}

/** Header trigger kept compatible with existing Screen callers. */
export function ProfileSheet({ className }: { className?: string }) {
  const openSheet = useContext(ProfileSheetContext);
  const { t } = useLocale();

  return (
    <button
      type="button"
      aria-label={t("Account and more", "Cuenta y más")}
      onClick={openSheet ?? undefined}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent",
        className
      )}
    >
      <CircleUserRound className="h-5 w-5" />
    </button>
  );
}
