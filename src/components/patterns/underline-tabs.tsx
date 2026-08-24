"use client";

import { cn } from "@/lib/utils";

/**
 * Quiet underline tabs — the app's one way to switch views inside a
 * screen. Text weight + a hairline indicator, no pills or filled chips.
 */

export const underlineTabListClass =
  "-mx-4 flex gap-6 overflow-x-auto border-b border-border/60 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0";

export function underlineTabItemClass(active: boolean) {
  return cn(
    "relative flex min-h-11 shrink-0 items-center pt-1 text-body font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  );
}

export function UnderlineIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground"
    />
  );
}

interface UnderlineTabsProps<Key extends string> {
  tabs: { key: Key; label: string }[];
  value: Key;
  onChange: (key: Key) => void;
  ariaLabel: string;
  className?: string;
}

export function UnderlineTabs<Key extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
}: UnderlineTabsProps<Key>) {
  function moveFocus(
    currentIndex: number,
    delta: number,
    tabList: HTMLElement | null
  ) {
    const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    if (!next) return;
    onChange(next.key);
    requestAnimationFrame(() => {
      tabList
        ?.querySelector<HTMLButtonElement>(
          `[data-up-tab="${CSS.escape(next.key)}"]`
        )
        ?.focus();
    });
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(underlineTabListClass, className)}
    >
      {tabs.map((tab, index) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-up-tab={tab.key}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => {
              const tabList = event.currentTarget.closest<HTMLElement>(
                '[role="tablist"]'
              );
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(index, 1, tabList);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(index, -1, tabList);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveFocus(index, -index, tabList);
              } else if (event.key === "End") {
                event.preventDefault();
                moveFocus(index, tabs.length - index - 1, tabList);
              }
            }}
            className={underlineTabItemClass(active)}
          >
            {tab.label}
            <UnderlineIndicator active={active} />
          </button>
        );
      })}
    </div>
  );
}
