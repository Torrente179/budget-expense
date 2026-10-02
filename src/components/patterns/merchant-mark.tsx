"use client";

import { cn } from "@/lib/utils";
import { CategoryGlyph } from "@/components/shared/category-badge";

/**
 * The round mark that opens every feed row.
 *
 * Card Stream marks are quiet: a tinted disc in the category's colour carrying
 * the merchant's initial. The tint keeps categories distinguishable down a
 * column without a wall of saturated tiles competing with the accent.
 *
 * With no category at all, the disc takes a hue from a stable hash of the
 * title, so uncategorised rows still differ from one another.
 */

/** Hues for rows with no category. */
const FALLBACK_HUES = [
  "#6FA8E8",
  "#6FD3A0",
  "#A99BEF",
  "#6FCFE0",
  "#C39BEA",
  "#8FD9C0",
  "#F0A0C0",
  "#93A2F2",
];

function hashHue(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length];
}

/** First letter/number of the merchant, an emoji if it leads, else nothing. */
function initial(title: string): string | null {
  const first = Array.from(title.trim())[0];
  if (!first) return null;
  // Emoji-led names (user-authored Metas) keep their emoji as the mark.
  if (/\p{Extended_Pictographic}/u.test(first)) return first;
  return /[\p{L}\p{N}]/u.test(first) ? first.toUpperCase() : null;
}

interface MerchantMarkProps {
  title: string;
  /** Category colour, when the movement has one. */
  color?: string | null;
  /** Category icon key. Drawn only when the title has no usable initial. */
  icon?: string | null;
  /** Category name, used to resolve a pictogram when `icon` is missing. */
  categoryName?: string | null;
  /** Kept for callers; every mark is round in Card Stream. */
  round?: boolean;
  /** Outline instead of a fill, for a payment that has not happened yet. */
  outlined?: boolean;
  className?: string;
}

export function MerchantMark({
  title,
  color,
  icon,
  categoryName,
  outlined = false,
  className,
}: MerchantMarkProps) {
  const base = color || hashHue(title);
  const letter = initial(title);
  const hasCategory = Boolean(icon || categoryName);

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-heading font-extrabold",
        outlined && "text-muted-foreground ring-[1.5px] ring-inset ring-track",
        className
      )}
      style={
        outlined
          ? undefined
          : {
              backgroundColor: `color-mix(in srgb, ${base} 20%, transparent)`,
              color: `color-mix(in srgb, ${base} 48%, var(--tint-toward))`,
            }
      }
    >
      {letter ??
        (hasCategory ? (
          <CategoryGlyph
            icon={icon ?? ""}
            name={categoryName ?? undefined}
            className="h-5 w-5 stroke-[1.9]"
          />
        ) : (
          "?"
        ))}
    </span>
  );
}
