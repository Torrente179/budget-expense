"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { SwipeableRow } from "@/components/shared/swipeable-row";
import { useLocale } from "@/providers/locale-provider";

export type LedgerMovement = {
  id: string;
  kind: "expense" | "income";
  title: string;
  subtitle: string;
  categoryIcon?: { icon: string; color: string } | null;
  amount: number;
  currency: string;
  date: string;
  needsReview: boolean;
};

type VirtualItem =
  | { type: "header"; date: string; key: string }
  | {
      type: "row";
      movement: LedgerMovement;
      key: string;
    };

interface VirtualizedLedgerProps {
  grouped: Map<string, LedgerMovement[]>;
  isMobile: boolean;
  onEdit: (movement: LedgerMovement) => void;
  onSwipeDelete: (movement: LedgerMovement) => void;
  onDesktopDelete: (movement: LedgerMovement) => void;
}

export function VirtualizedLedger({
  grouped,
  isMobile,
  onEdit,
  onSwipeDelete,
  onDesktopDelete,
}: VirtualizedLedgerProps) {
  const { t, locale } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);

  const flatItems = useMemo(() => {
    const items: VirtualItem[] = [];
    for (const [date, dayItems] of grouped) {
      items.push({ type: "header", date, key: `h-${date}` });
      for (const movement of dayItems) {
        items.push({
          type: "row",
          movement,
          key: `${movement.kind}-${movement.id}`,
        });
      }
    }
    return items;
  }, [grouped]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () =>
      listRef.current?.closest("main") ??
      (typeof document !== "undefined"
        ? document.querySelector("main")
        : null),
    estimateSize: (index) => (flatItems[index]?.type === "header" ? 32 : 68),
    overscan: 10,
  });

  return (
    <div ref={listRef} className="relative w-full">
      <div
        style={{ height: virtualizer.getTotalSize() }}
        className="relative w-full"
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index];
          if (!item) return null;

          return (
            <div
              key={item.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {item.type === "header" ? (
                <p className="label-caps mb-1.5 px-4 pt-4">
                  {formatDate(item.date, "EEEE d MMMM yyyy", locale)}
                </p>
              ) : (
                <div className="-mx-4 divide-y divide-border/40 md:mx-0 md:overflow-hidden md:rounded-none md:bg-card md:ring-0">
                  <SwipeableRow
                    enabled={isMobile}
                    onDelete={() => onSwipeDelete(item.movement)}
                  >
                    <div className="group flex items-center bg-background md:bg-card">
                      <div className="min-w-0 flex-1">
                        <TransactionRow
                          title={item.movement.title}
                          subtitle={item.movement.subtitle}
                          amount={item.movement.amount}
                          currency={item.movement.currency}
                          kind={item.movement.kind}
                          category={item.movement.categoryIcon}
                          needsReview={item.movement.needsReview}
                          onClick={() => onEdit(item.movement)}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={t("Delete", "Eliminar")}
                        className="mr-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-[background-color,color,opacity] hover:bg-danger-subtle hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
                        onClick={() => onDesktopDelete(item.movement)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </SwipeableRow>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
