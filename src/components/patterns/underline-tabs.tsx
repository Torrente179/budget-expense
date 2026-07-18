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
    "relative shrink-0 pb-2.5 text-body font-medium whitespace-nowrap transition-colors",
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
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(underlineTabListClass, className)}
    >
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
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
