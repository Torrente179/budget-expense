"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export interface WizardStep<Id extends string> {
  id: Id;
  label: string;
}

interface WizardModalProps<Id extends string> {
  open: boolean;
  /** Called only when the wizard itself decides to close (never on open). */
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  steps: WizardStep<Id>[];
  step: Id;
  body: ReactNode;
  footer: ReactNode;
  /** Blocks closing while a submit is in flight. */
  submitting?: boolean;
  /** Desktop dialog width; defaults to the 54rem the budget wizard uses. */
  desktopClassName?: string;
}

/**
 * The three-step modal shell: Dialog on desktop, bottom Sheet under 768px.
 *
 * Extracted from `budgets/budget-wizard.tsx` so the Patrimonio wizards do not
 * re-implement the step indicator, the a11y title/description branch, or the
 * discard guard four more times.
 *
 * Mobile is a bottom sheet rather than a centered modal because `design.md` §4
 * mandates bottom sheets for mobile forms and the budget wizard already behaves
 * this way — one switcher shape across the app beats matching a single mockup.
 */
export function WizardModal<Id extends string>({
  open,
  onOpenChange,
  title,
  description,
  steps,
  step,
  body,
  footer,
  submitting = false,
  desktopClassName = "sm:max-w-[54rem]",
}: WizardModalProps<Id>) {
  const { t } = useLocale();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const stepIndex = Math.max(
    steps.findIndex((item) => item.id === step),
    0
  );

  const header = (
    <div className="border-b border-border/60 px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {isMobile ? (
            <SheetTitle className="text-heading">{title}</SheetTitle>
          ) : (
            <DialogTitle className="text-heading">{title}</DialogTitle>
          )}
          {isMobile ? (
            <SheetDescription className="mt-0.5 text-caption">
              {description}
            </SheetDescription>
          ) : (
            <DialogDescription className="mt-0.5 text-caption">
              {description}
            </DialogDescription>
          )}
        </div>
        <p className="shrink-0 pr-8 text-caption text-muted-foreground">
          {t(
            `Step ${stepIndex + 1} of ${steps.length}`,
            `Paso ${stepIndex + 1} de ${steps.length}`
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {steps.map((item, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;
          return (
            <div key={item.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-caption",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {index < steps.length - 1 && (
                <span className="h-px flex-1 bg-border" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const shell = (
    <div className="flex max-h-[inherit] flex-col">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-5 py-4 sm:px-6">
        {footer}
      </div>
    </div>
  );

  // Opening is a no-op so only the wizard's own close path can dismiss it —
  // that is what lets the discard guard intercept Escape and the X.
  const handleOpenChange = (next: boolean) => {
    if (next || submitting) return;
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] rounded-t-3xl border-x border-t p-0"
        >
          {shell}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("max-h-[90vh] gap-0 p-0", desktopClassName)}
      >
        {shell}
      </DialogContent>
    </Dialog>
  );
}

interface DiscardPanelProps {
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * The body/footer pair shown when closing a dirty wizard.
 *
 * The caller owns the dirty check, because only it knows its form. With
 * react-hook-form read `form.formState.isDirty` **during render**: its
 * formState is a proxy that subscribes only to what the render touches, so
 * reading `isDirty` solely inside a close handler always reports `false`.
 */
export function useDiscardPanel({
  onKeepEditing,
  onDiscard,
}: DiscardPanelProps) {
  const { t } = useLocale();

  return {
    body: (
      <div className="space-y-2 px-5 py-10 text-center sm:px-6">
        <p className="text-heading font-semibold">
          {t("Discard your changes?", "¿Descartar los cambios?")}
        </p>
        <p className="text-body text-muted-foreground">
          {t(
            "What you have entered will be lost.",
            "Se perderá lo que has introducido."
          )}
        </p>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost" onClick={onKeepEditing}>
          {t("Keep editing", "Seguir editando")}
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          {t("Discard", "Descartar")}
        </Button>
      </>
    ),
  };
}
