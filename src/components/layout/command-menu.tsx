"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

const CommandMenuContents = dynamic(
  () =>
    import("@/components/layout/command-menu-contents").then(
      (module) => module.CommandMenuContents
    ),
  { ssr: false }
);

/** Lightweight trigger; cmdk and dialog code load only after first use. */
export function CommandMenu({ onInk = false }: { onInk?: boolean }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn(
          "h-9 gap-2 rounded-full border px-3",
          onInk
            ? "border-white/10 bg-white/[0.07] text-white/70 hover:bg-white/10 hover:text-white"
            : "border-border bg-secondary px-3 text-muted-foreground"
        )}
      >
        <Search className="h-4 w-4" />
        <span className="text-caption">{t("Search", "Buscar")}</span>
        <kbd
          className={cn(
            "rounded-md border px-1.5 font-mono text-label",
            onInk
              ? "border-white/10 bg-ink-2 text-white/48"
              : "border-border bg-background text-muted-foreground"
          )}
        >
          ⌘K
        </kbd>
      </Button>
      {open && <CommandMenuContents open={open} onOpenChange={setOpen} />}
    </>
  );
}
