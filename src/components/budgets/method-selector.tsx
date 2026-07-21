"use client";

import { useMemo, useState } from "react";
import {
  getBudgetingMethods,
  type BudgetingMethod,
  type BudgetAllocationSlice,
} from "@/lib/budgeting-methods";
import { useLocale } from "@/providers/locale-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronRight,
  Church,
  CreditCard,
  HandHeart,
  Heart,
  Home,
  PiggyBank,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Vault,
  Wallet,
  Layers,
} from "lucide-react";
import type { ComponentType } from "react";

/* ------------------------------------------------------------------ */
/*  Icon resolver                                                      */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  home: Home,
  sparkles: Sparkles,
  "piggy-bank": PiggyBank,
  shield: Shield,
  wallet: Wallet,
  "trending-up": TrendingUp,
  church: Church,
  "hand-heart": HandHeart,
  "shopping-cart": ShoppingCart,
  heart: Heart,
  "credit-card": CreditCard,
  vault: Vault,
  target: Target,
  "book-open": BookOpen,
  star: Star,
};

function resolveIcon(name: string): ComponentType<{ className?: string }> {
  return ICON_MAP[name] ?? Sparkles;
}

/* ------------------------------------------------------------------ */
/*  Allocation bar                                                     */
/* ------------------------------------------------------------------ */

function AllocationBar({ slices }: { slices: BudgetAllocationSlice[] }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {slices.map((slice) => (
        <div
          key={slice.key}
          className="transition-all duration-300"
          style={{
            width: `${slice.percent}%`,
            backgroundColor: slice.color,
          }}
          title={`${slice.label}: ${slice.percent}%`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Method detail                                                      */
/* ------------------------------------------------------------------ */

function MethodDetail({
  method,
  onApply,
}: {
  method: BudgetingMethod;
  onApply?: (method: BudgetingMethod) => void;
}) {
  const { t } = useLocale();
  const totalAllocation = method.slices.reduce((sum, s) => sum + s.percent, 0);

  return (
    <div className="space-y-5">
      {/* How it works — plain-language explanation, leads everything else */}
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
          {t("How it works", "Cómo funciona")}
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/90">
          {method.description}
        </p>
        {method.origin && (
          <p className="mt-2 text-xs text-muted-foreground">
            — {method.origin}
          </p>
        )}
      </div>

      {/* Allocation bar */}
      <div className="rounded-xl border border-border/70 bg-card/90 p-4">
        <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
          {t("Income allocation", "Distribución del ingreso")}
        </p>
        <div className="mt-3">
          <AllocationBar slices={method.slices} />
        </div>
        <div className="mt-4 grid gap-2">
          {method.slices.map((slice) => {
            const Icon = resolveIcon(slice.icon);
            return (
              <div
                key={slice.key}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2.5"
              >
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${slice.color}18`, color: slice.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {slice.label}
                    </p>
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-secondary/60 font-mono text-xs"
                    >
                      {slice.percent}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {slice.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Principles */}
      <div className="rounded-xl border border-border/70 bg-secondary/45 p-4">
        <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
          {t("Key principles", "Principios clave")}
        </p>
        <ul className="mt-3 space-y-2">
          {method.principles.map((p, i) => (
            <li
              key={i}
              className="rounded-xl border bg-card px-3 py-2.5"
            >
              <p className="text-sm leading-6 text-foreground/90">{p.text}</p>
              {p.reference && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {p.reference}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Best for */}
      <div className="rounded-xl border border-border/70 bg-secondary/45 p-4">
        <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
          {t("Best for", "Ideal para")}
        </p>
        <ul className="mt-3 space-y-2">
          {method.bestFor.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/90">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {onApply && (
        <div className="space-y-2.5 rounded-xl border border-info/25 bg-info-subtle p-4">
          <p className="text-sm leading-6 text-foreground/90">
            {t(
              `Applying this creates named budgets from the slices above (% of income) and sets your plan allocation to ${totalAllocation}%. Generosidad / giving stays on its own Primicias card — not duplicated here.`,
              `Aplicarlo crea presupuestos con las franjas de arriba (% del ingreso) y fija la asignación del plan al ${totalAllocation}%. Generosidad sigue en su tarjeta de Primicias — no se duplica aquí.`
            )}
          </p>
          <Button className="w-full gap-2" onClick={() => onApply(method)}>
            <Layers className="h-4 w-4" />
            {t(
              "Create budgets with this method",
              "Crear presupuestos con este método"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface MethodSelectorProps {
  onApply?: (method: BudgetingMethod) => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function MethodSelector({ onApply, trigger }: MethodSelectorProps) {
  const { locale, t } = useLocale();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [open, setOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  const content = useMemo(() => getBudgetingMethods(locale), [locale]);
  const selectedMethod = useMemo(
    () => content.methods.find((m) => m.id === selectedMethodId) ?? null,
    [content.methods, selectedMethodId]
  );

  function handleApply(method: BudgetingMethod) {
    void Promise.resolve(onApply?.(method)).finally(() => {
      setOpen(false);
      setSelectedMethodId(null);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-info/30 bg-info-subtle text-info hover:border-info/45 hover:bg-info/15 hover:text-info"
            />
          }
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline">
            {t("Budgeting methods", "Métodos de presupuesto")}
          </span>
        </SheetTrigger>
      )}

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full border-l border-border/80 bg-popover/96 p-0 shadow-3 sm:max-w-[520px] data-[side=bottom]:max-h-[92vh] data-[side=bottom]:rounded-t-3xl data-[side=bottom]:border-x data-[side=bottom]:border-t"
      >
        <SheetHeader className="border-b border-border/70 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <SheetTitle>
                {selectedMethod
                  ? selectedMethod.name
                  : t("Budgeting methods", "Métodos de presupuesto")}
              </SheetTitle>
              <SheetDescription>
                {selectedMethod
                  ? selectedMethod.tagline
                  : t(
                      "Explore frameworks. Applying one creates real budgets you can track.",
                      "Explora marcos. Aplicar uno crea presupuestos reales que puedes seguir."
                    )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ maxHeight: isMobile ? "65vh" : "calc(100vh - 160px)" }}>
          <AnimatePresence mode="wait">
            {selectedMethod ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4 gap-1.5 text-muted-foreground"
                  onClick={() => setSelectedMethodId(null)}
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  {t("All methods", "Todos los métodos")}
                </Button>
                <MethodDetail method={selectedMethod} onApply={handleApply} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3"
              >
                {content.methods.map((method, index) => (
                  <motion.button
                    key={method.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => setSelectedMethodId(method.id)}
                    className="w-full rounded-xl border border-border/70 bg-card/92 p-4 text-left transition-all duration-200 hover:border-foreground/12 hover:bg-secondary/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-foreground">
                            {method.name}
                          </p>
                          {method.isFaithBased && (
                            <Badge
                              variant="outline"
                              className="bg-warning-subtle text-label text-warning"
                            >
                              {t("Faith-based", "Basado en fe")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.tagline}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-3">
                      <AllocationBar slices={method.slices} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {method.slices.map((s) => (
                        <span
                          key={s.key}
                          className="text-label text-muted-foreground"
                        >
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label} {s.percent}%
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}

                <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(
                      "These are starting frameworks. Adjust percentages in your monthly plan to fit your cost of living, obligations, and generosity goals.",
                      "Estos son marcos iniciales. Ajusta los porcentajes en tu plan mensual para adaptarlos a tu costo de vida, obligaciones y metas de generosidad."
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SheetFooter className="border-t border-border/70 bg-background/92 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => { setOpen(false); setSelectedMethodId(null); }}>
            {t("Close", "Cerrar")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
