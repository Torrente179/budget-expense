"use client";

import { cn } from "@/lib/utils";
import { CategoryGlyph } from "@/components/shared/category-badge";

/**
 * The square mark that opens every feed row.
 *
 * Up's feed marks are saturated tiles carrying a pictogram — a real brand logo
 * where one exists. We have no logo assets, so the tile is filled with the
 * category colour and carries the category's line-art glyph in white. That
 * keeps the category legible at a glance, which is what the glyph is for, while
 * the colour still distinguishes rows down the column.
 *
 * With no category at all, it falls back to the merchant's initial on a tile
 * coloured by a stable hash of the title — so uncategorised rows still differ
 * from one another instead of forming a column of identical grey squares.
 */

/**
 * Hues for rows with no category. Drawn from the same "Cool" family as
 * `PALETTE.categories` so an uncategorised row sits in the palette rather than
 * standing out as a stray colour.
 */
const FALLBACK_HUES = [
  "#3A7DC4",
  "#2E9E6B",
  "#6D5BC0",
  "#2F97AE",
  "#8258B8",
  "#4FA88E",
  "#C25E86",
  "#5566CC",
];

function hashHue(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length];
}

/** First letter/number of the merchant, or an emoji if the name starts with one. */
function initial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "?";
  const first = Array.from(trimmed)[0];
  // Emoji-led names (user-authored Metas) keep their emoji as the mark.
  if (/\p{Extended_Pictographic}/u.test(first)) return first;
  return first.toUpperCase();
}

interface MerchantMarkProps {
  title: string;
  /** Category colour, when the movement has one. */
  color?: string | null;
  /** Category icon key — draws the pictogram instead of the initial. */
  icon?: string | null;
  /** Category name, used to resolve a pictogram when `icon` is missing. */
  categoryName?: string | null;
  /** Circular instead of squircle — used for people (transfers, splits). */
  round?: boolean;
  className?: string;
}

export function MerchantMark({
  title,
  color,
  icon,
  categoryName,
  round = false,
  className,
}: MerchantMarkProps) {
  const bg = color || hashHue(title);
  const hasCategory = Boolean(icon || categoryName);

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden text-body font-bold text-white",
        round ? "rounded-full" : "rounded-[0.6rem]",
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {hasCategory ? (
        <CategoryGlyph
          icon={icon ?? ""}
          name={categoryName ?? undefined}
          className="h-[1.125rem] w-[1.125rem] stroke-[1.9]"
        />
      ) : (
        initial(title)
      )}
    </span>
  );
}
