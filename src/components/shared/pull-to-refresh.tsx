"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}

const TRIGGER_PX = 70;

/**
 * Touch-only pull-to-refresh. Tracks touch moves that start with the page
 * scrolled to the top; past the threshold it runs onRefresh (typically a
 * react-query invalidate). Desktop pointer users are unaffected.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function scrollTop(): number {
    // The app scrolls inside <main class="overflow-y-auto"> — walk up to it
    return (
      document.querySelector("main")?.scrollTop ??
      document.documentElement.scrollTop
    );
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (refreshing || scrollTop() > 0) return;
    startY.current = event.touches[0].clientY;
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0 && scrollTop() === 0) {
      // Resistance curve so the pull feels physical
      setPull(Math.min(delta * 0.4, TRIGGER_PX * 1.4));
    }
  }

  async function handleTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= TRIGGER_PX && !refreshing) {
      setRefreshing(true);
      setPull(TRIGGER_PX * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pull }}
        aria-hidden={pull === 0}
      >
        <Loader2
          className={`h-5 w-5 text-muted-foreground ${
            refreshing ? "animate-spin" : ""
          }`}
          style={{
            opacity: Math.min(pull / TRIGGER_PX, 1),
            transform: refreshing
              ? undefined
              : `rotate(${(pull / TRIGGER_PX) * 270}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
