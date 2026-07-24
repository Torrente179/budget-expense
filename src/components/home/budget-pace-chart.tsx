"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { cn, formatCurrencyWithBreaks } from "@/lib/utils";
import {
  budgetUsageColor,
  resolveBudgetUsageTone,
  type BudgetUsageTone,
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

function formatUsagePercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "∞";
  const pct = Math.round(Math.min(ratio, 9.99) * 100);
  return pct > 999 ? "999+" : String(pct);
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

/** How many Metas-style cards fit per carousel page (one row, side by side). */
const MAX_PER_PAGE = 3;

/** Card glyph sizing, shared by category icons and the no-category fallback. */
const GLYPH_CLASS =
  "h-3.5 w-3.5 @min-[8rem]/budget-card:h-4 @min-[8rem]/budget-card:w-4 @min-[11rem]/budget-card:h-[1.125rem] @min-[11rem]/budget-card:w-[1.125rem]";

const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/** Meter geometry in viewBox units so the ring scales with its CSS width. */
const METER_VIEW = 100;
const METER_STROKE = 12;
const METER_RADIUS = (METER_VIEW - METER_STROKE) / 2;
const METER_CIRCUMFERENCE = 2 * Math.PI * METER_RADIUS;

function CircularMeter({
  ratio,
  monthProgress,
  showPaceMark,
  tone,
  className,
  children,
}: {
  ratio: number;
  monthProgress: number;
  showPaceMark: boolean;
  tone: BudgetUsageTone;
  className?: string;
  children?: ReactNode;
}) {
  const filled = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 1;
  const dashOffset = METER_CIRCUMFERENCE * (1 - filled);
  /* SVG is CSS-rotated -90deg, so 0rad already sits at 12 o'clock. */
  const paceRad = monthProgress * 2 * Math.PI;
  const paceX = METER_VIEW / 2 + METER_RADIUS * Math.cos(paceRad);
  const paceY = METER_VIEW / 2 + METER_RADIUS * Math.sin(paceRad);
  const stroke = budgetUsageColor(tone);

  return (
    <div className={cn("relative aspect-square shrink-0", className)}>
      <svg
        viewBox={`0 0 ${METER_VIEW} ${METER_VIEW}`}
        className="block h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx={METER_VIEW / 2}
          cy={METER_VIEW / 2}
          r={METER_RADIUS}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={METER_STROKE}
        />
        <circle
          cx={METER_VIEW / 2}
          cy={METER_VIEW / 2}
          r={METER_RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={METER_STROKE}
          strokeLinecap="round"
          strokeDasharray={METER_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        {showPaceMark && (
          <circle
            cx={paceX}
            cy={paceY}
            r={METER_STROKE / 2.6}
            fill="var(--foreground)"
            stroke="var(--card)"
            strokeWidth={2}
          />
        )}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Metas-style card for a spending Presupuesto: icon + ring on top, then
 * name and `spent` / `of limit`. Sizes scale off the card's own width
 * (container queries) so three fit side by side even in the Home column.
 * Colors follow spending-limit usage bands (safe → critical), never Metas
 * success green at 100%.
 */
function BudgetMetaCard({
  budget,
  monthProgress,
  isCurrentMonth,
  onSelect,
}: {
  budget: BudgetPaceItem;
  monthProgress: number;
  isCurrentMonth: boolean;
  onSelect?: (budgetId: string) => void;
}) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const tone = resolveBudgetUsageTone(budget.ratio);
  const pct = formatUsagePercent(budget.ratio);
  const toneColor = budgetUsageColor(tone);
  const overLimit = !Number.isFinite(budget.ratio) || budget.ratio >= 1;
  const limitLabel = formatCurrencyWithBreaks(
    budget.limit,
    baseCurrency,
    intlLocale
  );

  const className =
    "flex h-full w-full min-w-0 flex-col gap-2.5 rounded-2xl bg-card px-3 py-3 text-left ring-1 ring-border/60 shadow-1 transition-all hover:shadow-2 hover:ring-border/80 active:bg-accent/40 @min-[10rem]/budget-card:gap-3 @min-[10rem]/budget-card:px-3.5 @min-[10rem]/budget-card:py-3.5";
  const ariaLabel = t(
    `${budget.name}: ${pct}% used`,
    `${budget.name}: ${pct}% usado`
  );

  const content = (
    <>
      <div className="flex items-center justify-between gap-1.5">
        <span
          className="flex aspect-square w-7 shrink-0 items-center justify-center rounded-full @min-[8rem]/budget-card:w-9 @min-[11rem]/budget-card:w-10"
          style={{ backgroundColor: `${toneColor}1f`, color: toneColor }}
          aria-hidden
        >
          {budget.icon ? (
            <CategoryGlyph icon={budget.icon} className={GLYPH_CLASS} />
          ) : (
            <Target className={GLYPH_CLASS} />
          )}
        </span>

        <CircularMeter
          ratio={budget.ratio}
          monthProgress={monthProgress}
          showPaceMark={isCurrentMonth}
          tone={tone}
          className="w-9 @min-[8rem]/budget-card:w-11 @min-[11rem]/budget-card:w-12"
        >
          <span
            className="font-mono text-[0.625rem] font-semibold leading-none tracking-[-0.04em] tabular-nums @min-[8rem]/budget-card:text-[0.6875rem] @min-[11rem]/budget-card:text-caption"
            style={{ color: overLimit ? toneColor : "var(--foreground)" }}
          >
            {pct}
            {pct !== "∞" && "%"}
          </span>
        </CircularMeter>
      </div>

      <div className="min-w-0">
        <p className="truncate text-caption font-semibold leading-tight @min-[8rem]/budget-card:text-body">
          {budget.name}
        </p>
        <p
          className={cn(
            "mt-1 font-mono text-[0.625rem] leading-tight tabular-nums @min-[9rem]/budget-card:text-[0.6875rem]",
            !overLimit && "text-muted-foreground"
          )}
          style={overLimit ? { color: toneColor } : undefined}
        >
          {formatCurrencyWithBreaks(budget.spent, baseCurrency, intlLocale)}
        </p>
        <p className="mt-0.5 font-mono text-[0.625rem] leading-tight tabular-nums text-muted-foreground @min-[9rem]/budget-card:text-[0.6875rem]">
          {t(`of ${limitLabel}`, `de ${limitLabel}`)}
        </p>
      </div>
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
  monthProgress,
  isCurrentMonth,
  onSelect,
}: {
  budgets: BudgetPaceItem[];
  /** Fixed across pages so cards keep one width while swiping. */
  columns: number;
  monthProgress: number;
  isCurrentMonth: boolean;
  onSelect?: (budgetId: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid w-full items-stretch gap-2.5",
        COLUMN_CLASS[columns] ?? COLUMN_CLASS[MAX_PER_PAGE],
        columns === 1 && "sm:max-w-[14rem]"
      )}
      role="list"
    >
      {budgets.map((budget) => (
        <BudgetMetaCard
          key={budget.id}
          budget={budget}
          monthProgress={monthProgress}
          isCurrentMonth={isCurrentMonth}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface BudgetPaceChartProps {
  budgets: BudgetPaceItem[];
  monthProgress: number;
  isCurrentMonth: boolean;
  /** When set, cards act as buttons instead of linking to `/budget`. */
  onSelect?: (budgetId: string) => void;
}

/**
 * Home Presupuestos overview: a row of up to three Metas-style cards
 * (spent / limit). More than three spill into swipeable pages.
 * Ring color follows spending-limit usage bands, not month pace.
 */
export function BudgetPaceChart({
  budgets,
  monthProgress,
  isCurrentMonth,
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
    setActivePage(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [budgets.length]);

  if (pages.length === 0) return null;

  if (pages.length === 1) {
    return (
      <div aria-label={t("Monthly budgets", "Presupuestos del mes")}>
        <BudgetPage
          budgets={pages[0]}
          columns={Math.min(pages[0].length, MAX_PER_PAGE)}
          monthProgress={monthProgress}
          isCurrentMonth={isCurrentMonth}
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
            aria-hidden={pageIndex !== activePage}
          >
            <BudgetPage
              budgets={page}
              columns={MAX_PER_PAGE}
              monthProgress={monthProgress}
              isCurrentMonth={isCurrentMonth}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5" role="tablist">
        {pages.map((_, pageIndex) => (
          <button
            key={`budget-dot-${pageIndex}`}
            type="button"
            role="tab"
            aria-selected={pageIndex === activePage}
            aria-label={t(
              `Budgets page ${pageIndex + 1} of ${pages.length}`,
              `Presupuestos página ${pageIndex + 1} de ${pages.length}`
            )}
            className={cn(
              "h-1.5 rounded-full transition-all",
              pageIndex === activePage
                ? "w-4 bg-foreground"
                : "w-1.5 bg-border hover:bg-muted-foreground/50"
            )}
            onClick={() => {
              const el = scrollerRef.current;
              if (!el) return;
              el.scrollTo({
                left: pageIndex * el.clientWidth,
                behavior: "smooth",
              });
              setActivePage(pageIndex);
            }}
          />
        ))}
      </div>
    </div>
  );
}
