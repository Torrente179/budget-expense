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
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";

export interface BudgetPaceItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  ratio: number;
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

/** How many Metas-style cards fit per carousel page. */
const MAX_PER_PAGE = 3;

function CircularMeter({
  ratio,
  monthProgress,
  showPaceMark,
  size,
  strokeWidth,
  tone,
  children,
}: {
  ratio: number;
  monthProgress: number;
  showPaceMark: boolean;
  size: number;
  strokeWidth: number;
  tone: BudgetUsageTone;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Number.isFinite(ratio)
    ? Math.min(Math.max(ratio, 0), 1)
    : 1;
  const dashOffset = circumference * (1 - filled);
  const paceAngle = monthProgress * 360 - 90;
  const paceRad = (paceAngle * Math.PI) / 180;
  const paceX = size / 2 + radius * Math.cos(paceRad);
  const paceY = size / 2 + radius * Math.sin(paceRad);
  const markSize = 6;
  const stroke = budgetUsageColor(tone);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showPaceMark && (
        <span
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-1 ring-2 ring-card"
          style={{
            left: paceX,
            top: paceY,
            width: markSize,
            height: markSize,
          }}
        />
      )}
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Metas-style horizontal card for a spending Presupuesto.
 * Colors follow spending-limit usage bands (safe → critical), never Metas success green at 100%.
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
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const tone = resolveBudgetUsageTone(budget.ratio);
  const pct = formatUsagePercent(budget.ratio);
  const toneColor = budgetUsageColor(tone);
  const remaining = budget.limit - budget.spent;

  const className =
    "flex w-full min-w-0 items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border/60 shadow-1 transition-all hover:shadow-2 hover:ring-border/80 active:bg-accent/40";
  const ariaLabel = t(
    `${budget.name}: ${pct}% used`,
    `${budget.name}: ${pct}% usado`
  );

  const content = (
    <>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${toneColor}18`, color: toneColor }}
        aria-hidden
      >
        <Target className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium leading-tight">
          {budget.name}
        </p>
        <p
          className={cn(
            "mt-0.5 font-mono text-[0.6875rem] leading-tight tabular-nums",
            remaining >= 0 ? "text-muted-foreground" : "text-expense"
          )}
        >
          <span className="text-expense">
            {formatCurrencyWithBreaks(budget.spent, baseCurrency)}
          </span>
          {" / "}
          {formatCurrencyWithBreaks(budget.limit, baseCurrency)}
        </p>
      </div>

      <CircularMeter
        ratio={budget.ratio}
        monthProgress={monthProgress}
        showPaceMark={isCurrentMonth}
        size={52}
        strokeWidth={5}
        tone={tone}
      >
        <span
          className="font-mono text-[0.6875rem] font-semibold leading-none tracking-[-0.03em] tabular-nums"
          style={{ color: toneColor }}
        >
          {pct}
          {pct !== "∞" && <span className="text-[0.55em]">%</span>}
        </span>
      </CircularMeter>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        role="listitem"
        className={className}
        aria-label={ariaLabel}
        onClick={() => onSelect(budget.id)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/budget" role="listitem" className={className} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

function BudgetPage({
  budgets,
  monthProgress,
  isCurrentMonth,
  onSelect,
}: {
  budgets: BudgetPaceItem[];
  monthProgress: number;
  isCurrentMonth: boolean;
  onSelect?: (budgetId: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-2.5",
        budgets.length === 1 && "sm:max-w-sm"
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
 * Home Presupuestos overview: Metas-style cards (spent / limit).
 * More than 3 budgets spill into swipeable pages.
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
        className="-mx-1 flex snap-x snap-mandatory overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, pageIndex) => (
          <div
            key={`budget-page-${pageIndex}`}
            className="w-full shrink-0 snap-center px-0.5"
            aria-hidden={pageIndex !== activePage}
          >
            <BudgetPage
              budgets={page}
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
