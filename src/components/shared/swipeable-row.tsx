"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  /** Disable swiping (e.g. desktop pointer users keep hover actions). */
  enabled?: boolean;
}

const ACTION_WIDTH = 88;
const TRIGGER_DISTANCE = 56;

/**
 * Touch swipe actions on list rows without framer-motion per row.
 * Uses pointer events + CSS transform so virtualized lists stay cheap.
 */
export function SwipeableRow({
  children,
  onDelete,
  onEdit,
  enabled = true,
}: SwipeableRowProps) {
  const { t } = useLocale();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const offsetRef = useRef(0);

  if (!enabled || (!onDelete && !onEdit)) {
    return <>{children}</>;
  }

  const minX = onDelete ? -ACTION_WIDTH : 0;
  const maxX = onEdit ? ACTION_WIDTH : 0;

  function close() {
    offsetRef.current = 0;
    setOffset(0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    axisLockRef.current = null;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = event.clientX - startXRef.current;
    const dy = event.clientY - startYRef.current;

    if (!axisLockRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisLockRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisLockRef.current === "y") {
        setDragging(false);
        return;
      }
    }
    if (axisLockRef.current !== "x") return;

    const next = Math.min(maxX, Math.max(minX, dx));
    offsetRef.current = next;
    setOffset(next);
  }

  function handlePointerUp() {
    if (!dragging && axisLockRef.current !== "x") {
      setDragging(false);
      return;
    }
    setDragging(false);
    const current = offsetRef.current;
    if (onDelete && current < -TRIGGER_DISTANCE) {
      offsetRef.current = -ACTION_WIDTH;
      setOffset(-ACTION_WIDTH);
      return;
    }
    if (onEdit && current > TRIGGER_DISTANCE) {
      offsetRef.current = ACTION_WIDTH;
      setOffset(ACTION_WIDTH);
      return;
    }
    close();
  }

  const revealed =
    offset <= -TRIGGER_DISTANCE / 2
      ? "left"
      : offset >= TRIGGER_DISTANCE / 2
        ? "right"
        : null;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {onEdit && (
        <button
          type="button"
          onClick={() => {
            close();
            onEdit();
          }}
          className={`absolute inset-y-0 left-0 flex w-[88px] items-center justify-center bg-secondary text-secondary-foreground transition-opacity ${
            revealed === "right" ? "opacity-100" : "opacity-0"
          }`}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t("Edit", "Editar")}</span>
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => {
            close();
            onDelete();
          }}
          className={`absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-destructive/15 text-destructive transition-opacity ${
            revealed === "left" ? "opacity-100" : "opacity-0"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{t("Delete", "Eliminar")}</span>
        </button>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (offsetRef.current !== 0) close();
        }}
        style={{
          touchAction: "pan-y",
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
        className="relative will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
