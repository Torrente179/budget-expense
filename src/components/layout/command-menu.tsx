"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";

const CommandMenuContents = dynamic(
  () =>
    import("@/components/layout/command-menu-contents").then(
      (module) => module.CommandMenuContents
    ),
  { ssr: false }
);

/**
 * Lightweight trigger; cmdk and dialog code load only after first use.
 * A round icon button on phones, a labelled pill with the shortcut on desktop.
 */
export function CommandMenu() {
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
        aria-label={t("Search", "Buscar")}
        onClick={() => setOpen(true)}
        className="h-11 w-11 shrink-0 gap-2 rounded-full border border-border bg-card p-0 text-foreground lg:w-auto lg:px-3.5 lg:text-muted-foreground"
      >
        <Search className="h-[1.125rem] w-[1.125rem] lg:h-4 lg:w-4" />
        <span className="hidden text-caption lg:inline">
          {t("Search", "Buscar")}
        </span>
        <kbd className="hidden rounded-md border border-border bg-background px-1.5 font-mono text-label text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </Button>
      {open && <CommandMenuContents open={open} onOpenChange={setOpen} />}
    </>
  );
}
