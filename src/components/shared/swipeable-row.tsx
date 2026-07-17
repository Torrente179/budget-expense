"use client";

import { useRef, useState } from "react";
import { motion, useAnimationControls, type PanInfo } from "framer-motion";
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
const SNAP_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

/**
 * Touch swipe actions on list rows: swipe left reveals delete, swipe right
 * reveals edit. Built on framer-motion drag="x" (no new dependency) with a
 * directional lock so vertical scrolling is never hijacked — `touch-action:
 * pan-y` keeps the browser scrolling vertically while we own the x axis.
 */
export function SwipeableRow({
  children,
  onDelete,
  onEdit,
  enabled = true,
}: SwipeableRowProps) {
  const { t } = useLocale();
  const controls = useAnimationControls();
  const [revealed, setRevealed] = useState<"left" | "right" | null>(null);
  const openRef = useRef(false);

  if (!enabled || (!onDelete && !onEdit)) {
    return <>{children}</>;
  }

  function close() {
    openRef.current = false;
    setRevealed(null);
    void controls.start({ x: 0, transition: SNAP_TRANSITION });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const fastFling = Math.abs(velocity.x) > 500;

    if (onDelete && (offset.x < -TRIGGER_DISTANCE || (fastFling && offset.x < 0))) {
      openRef.current = true;
      setRevealed("left");
      void controls.start({ x: -ACTION_WIDTH, transition: SNAP_TRANSITION });
      return;
    }
    if (onEdit && (offset.x > TRIGGER_DISTANCE || (fastFling && offset.x > 0))) {
      openRef.current = true;
      setRevealed("right");
      void controls.start({ x: ACTION_WIDTH, transition: SNAP_TRANSITION });
      return;
    }
    close();
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action layers behind the row */}
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

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{
          left: onDelete ? -ACTION_WIDTH : 0,
          right: onEdit ? ACTION_WIDTH : 0,
        }}
        dragElastic={0.08}
        animate={controls}
        onDragEnd={handleDragEnd}
        onTap={() => {
          if (openRef.current) close();
        }}
        style={{ touchAction: "pan-y" }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
