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

/** Lightweight trigger; cmdk and dialog code load only after first use. */
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
        onClick={() => setOpen(true)}
        className="h-9 gap-2 rounded-full border border-border bg-secondary/80 px-3 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="text-caption">{t("Search", "Buscar")}</span>
        <kbd className="rounded-md border border-border bg-background px-1.5 font-mono text-label text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      {open && <CommandMenuContents open={open} onOpenChange={setOpen} />}
    </>
  );
}
