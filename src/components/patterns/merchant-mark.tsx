"use client";

import { cn } from "@/lib/utils";

/**
 * The square mark that opens every feed row.
 *
 * Up puts **merchant identity** first — a real brand logo, not a category
 * glyph — because that is what you actually scan a statement for. We have no
 * logo assets, so the honest equivalent is the merchant's initial on a tile
 * tinted with its category colour: the letter carries the identity, the colour
 * keeps the category signal that `CategoryBadge` used to carry alone.
 *
 * Colour falls back to a stable hash of the title so uncategorised rows still
 * differ from one another instead of turning into a column of grey squares.
 */

/** Category-free fallback hues, spaced around the wheel and legible at 34px. */
const FALLBACK_HUES = [
  "#FF7A64",
  "#3DDC97",
  "#28C4D8",
  "#B565D8",
  "#F5A623",
  "#6C8AE4",
  "#E4699B",
  "#5EC26A",
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
  /** Circular instead of squircle — used for people (transfers, splits). */
  round?: boolean;
  className?: string;
}

export function MerchantMark({
  title,
  color,
  round = false,
  className,
}: MerchantMarkProps) {
  const bg = color || hashHue(title);
  const glyph = initial(title);

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
      {glyph}
    </span>
  );
}
