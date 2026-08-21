"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { cn, formatCurrencyWithBreaks } from "@/lib/utils";
import {
  budgetUsageColor,
  resolveBudgetUsageTone,
} from "@/lib/palette";
import { CategoryGlyph } from "@/components/shared/category-badge";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";

export interface BudgetPaceItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  ratio: number;
  /** Category `icon` key of the budget's leading category; falls back to a target. */
  icon?: string;
}

function chunkBudgets(
  budgets: BudgetPaceItem[],
  size: number
): BudgetPaceItem[][] {
  if (budgets.length === 0) return [];
  const pages: BudgetPaceItem[][] = [];
  for (let i = 0; i < budgets.length; i += size) {
    pages.push(budgets.slice(i, i + size));
  }
  return pages;
}

/** Two columns by two rows keeps the phone treatment legible and scan-first. */
const MAX_PER_PAGE = 4;

/** Card glyph sizing, shared by category icons and the no-category fallback. */
const GLYPH_CLASS =
  "h-3.5 w-3.5 @min-[8rem]/budget-card:h-4 @min-[8rem]/budget-card:w-4 @min-[11rem]/budget-card:h-[1.125rem] @min-[11rem]/budget-card:w-[1.125rem]";

const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

/**
 * Up's Tracker card for a spending Presupuesto.
 *
 * **Remaining-first**: the headline is what is left (`€124 left`) or, past the
 * limit, what it is over by (`€38 over`). Up never shows a bare percentage, so
 * the ring and the `%` numeral are gone — the only quantity on the card is an
 * amount, and the thin bar hugging the bottom edge carries the proportion.
 * The bar runs in the category accent and turns red once over.
 */
export function BudgetTrackerTile({
  budget,
  onSelect,
}: {
  budget: BudgetPaceItem;
  onSelect?: (budgetId: string) => void;
}) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const overLimit = budget.spent > budget.limit;
  const tone = resolveBudgetUsageTone(overLimit ? Math.max(budget.ratio, 1) : 0);
  const toneColor = overLimit ? budgetUsageColor(tone) : "var(--coral)";

  const remaining = budget.limit - budget.spent;
  const remainingLabel = formatCurrencyWithBreaks(
    Math.abs(remaining),
    baseCurrency,
    intlLocale
  );
  const headline = overLimit
    ? t(`${remainingLabel} over`, `${remainingLabel} de más`)
    : t(`${remainingLabel} left`, `quedan ${remainingLabel}`);

  const fillPct = Math.max(
    0,
    Math.min(Number.isFinite(budget.ratio) ? budget.ratio : 1, 1) * 100
  );

  const className =
    "flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl bg-ink-2 text-left text-white transition-transform active:scale-[0.985]";
  const ariaLabel = `${budget.name}: ${headline}`;

  const content = (
    <>
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-3 @min-[10rem]/budget-card:px-3.5 @min-[10rem]/budget-card:py-3.5">
        <span style={{ color: toneColor }} aria-hidden>
          {budget.icon ? (
            <CategoryGlyph icon={budget.icon} className={GLYPH_CLASS} />
          ) : (
            <Target className={GLYPH_CLASS} />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-caption font-medium leading-tight text-white/65">
            {budget.name}
          </p>
          <p
            className="mt-0.5 line-clamp-2 font-mono text-[clamp(0.75rem,3.2vw,1.0625rem)] font-bold leading-tight tabular-nums"
            style={overLimit ? { color: toneColor } : undefined}
          >
            {headline}
          </p>
        </div>
      </div>
      {/* Full-bleed to the card's corners, the way Up draws it. */}
      <span className="up-track-dark block h-1" aria-hidden>
        <span
          className="block h-full transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
          style={{ width: `${fillPct}%`, backgroundColor: toneColor }}
        />
      </span>
    </>
  );

  /* Wrapper is the query container so the card can size off its own width. */
  return (
    <div className="@container/budget-card min-w-0" role="listitem">
      {onSelect ? (
        <button
          type="button"
          className={className}
          aria-label={ariaLabel}
          onClick={() => onSelect(budget.id)}
        >
          {content}
        </button>
      ) : (
        <Link href="/budget" className={className} aria-label={ariaLabel}>
          {content}
        </Link>
      )}
    </div>
  );
}

function BudgetPage({
  budgets,
  columns,
  onSelect,
}: {
  budgets: BudgetPaceItem[];
  /** Fixed across pages so cards keep one width while swiping. */
  columns: number;
  onSelect?: (budgetId: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid w-full items-stretch gap-2.5",
        COLUMN_CLASS[columns] ?? COLUMN_CLASS[2],
        columns === 1 && "sm:max-w-[14rem]"
      )}
      role="list"
    >
      {budgets.map((budget) => (
        <BudgetTrackerTile
          key={budget.id}
          budget={budget}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface BudgetPaceChartProps {
  budgets: BudgetPaceItem[];
  /** When set, cards act as buttons instead of linking to `/budget`. */
  onSelect?: (budgetId: string) => void;
}

/**
 * Home Presupuestos overview: up to four remaining-first Trackers in a compact
 * two-column page. Additional Trackers spill into swipeable pages. The month-
 * pace mark went with the ring — the card itself carries no bare percentage.
 */
export function BudgetPaceChart({
  budgets,
  onSelect,
}: BudgetPaceChartProps) {
  const { t } = useLocale();
  const pages = chunkBudgets(budgets, MAX_PER_PAGE);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const syncActivePage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || pages.length <= 1) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const index = Math.round(el.scrollLeft / width);
    setActivePage(Math.min(Math.max(index, 0), pages.length - 1));
  }, [pages.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || pages.length <= 1) return;
    el.addEventListener("scroll", syncActivePage, { passive: true });
    return () => el.removeEventListener("scroll", syncActivePage);
  }, [pages.length, syncActivePage]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setActivePage(0);
      scrollerRef.current?.scrollTo({ left: 0 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [budgets.length]);

  if (pages.length === 0) return null;

  if (pages.length === 1) {
    return (
      <div aria-label={t("Monthly budgets", "Presupuestos del mes")}>
        <BudgetPage
          budgets={pages[0]}
          columns={Math.min(pages[0].length, 2)}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      aria-label={t("Monthly budgets", "Presupuestos del mes")}
    >
      <div
        ref={scrollerRef}
        /* Flush horizontally so no card from the next page peeks; pages pad
           their own cards instead. Vertical padding keeps shadows uncut. */
        className="-my-1 flex snap-x snap-mandatory overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, pageIndex) => (
          <div
            key={`budget-page-${pageIndex}`}
            className="w-full shrink-0 snap-center px-1"
          >
            <BudgetPage
              budgets={page}
              columns={2}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-center"
        role="group"
        aria-label={t("Budget pages", "Páginas de presupuestos")}
      >
        {pages.map((_, pageIndex) => (
          <button
            key={`budget-dot-${pageIndex}`}
            type="button"
            aria-current={pageIndex === activePage ? "page" : undefined}
            aria-label={t(
              `Budgets page ${pageIndex + 1} of ${pages.length}`,
              `Presupuestos página ${pageIndex + 1} de ${pages.length}`
            )}
            className="group flex h-11 w-11 items-center justify-center rounded-full"
            onClick={() => {
              const el = scrollerRef.current;
              if (!el) return;
              el.scrollTo({
                left: pageIndex * el.clientWidth,
                behavior: "smooth",
              });
              setActivePage(pageIndex);
            }}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 rounded-full transition-all duration-[var(--motion-standard)]",
                pageIndex === activePage
                  ? "w-4 bg-coral"
                  : "w-1.5 bg-white/20 group-hover:bg-white/45"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
