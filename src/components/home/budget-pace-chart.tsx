"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn, formatCurrencyWithBreaks } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";

export interface BudgetPaceItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  ratio: number;
}

type PaceTone = "success" | "warning" | "danger";

const TONE_STROKE: Record<PaceTone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const TONE_TEXT: Record<PaceTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** How many rings fit comfortably in the home budgets card. */
const MAX_PER_PAGE = 3;

function resolveTone(ratio: number, monthProgress: number): PaceTone {
  if (!Number.isFinite(ratio) || ratio >= 1) return "danger";
  if (ratio > monthProgress + 0.02) return "warning";
  return "success";
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

/** Ring size shrinks as more budgets share a page. */
function resolveRingLayout(count: number): {
  size: number;
  strokeWidth: number;
  percentClass: string;
} {
  if (count <= 1) {
    return {
      size: 88,
      strokeWidth: 8,
      percentClass: "text-lg",
    };
  }
  if (count === 2) {
    return {
      size: 76,
      strokeWidth: 7,
      percentClass: "text-base",
    };
  }
  if (count === 3) {
    return {
      size: 64,
      strokeWidth: 6,
      percentClass: "text-sm",
    };
  }
  return {
    size: 56,
    strokeWidth: 5,
    percentClass: "text-xs",
  };
}

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
  tone: PaceTone;
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
  const markSize = size >= 72 ? 8 : 6;

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
          stroke={TONE_STROKE[tone]}
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

function BudgetRing({
  budget,
  monthProgress,
  isCurrentMonth,
  layout,
}: {
  budget: BudgetPaceItem;
  monthProgress: number;
  isCurrentMonth: boolean;
  layout: ReturnType<typeof resolveRingLayout>;
}) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const tone = resolveTone(budget.ratio, monthProgress);
  const pct = formatUsagePercent(budget.ratio);
  const remaining = budget.limit - budget.spent;

  return (
    <Link
      href="/budget"
      role="listitem"
      className="flex min-w-0 w-full flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition-colors hover:bg-accent/50 active:bg-accent/70"
      aria-label={t(
        `${budget.name}: ${pct}% used`,
        `${budget.name}: ${pct}% usado`
      )}
    >
      <CircularMeter
        ratio={budget.ratio}
        monthProgress={monthProgress}
        showPaceMark={isCurrentMonth}
        size={layout.size}
        strokeWidth={layout.strokeWidth}
        tone={tone}
      >
        <span
          className={cn(
            "font-mono font-semibold leading-none tracking-[-0.03em] tabular-nums",
            layout.percentClass,
            TONE_TEXT[tone]
          )}
        >
          {pct}
          {pct !== "∞" && <span className="text-[0.55em]">%</span>}
        </span>
      </CircularMeter>

      <p className="w-full truncate text-center text-caption font-medium leading-tight">
        {budget.name}
      </p>
      <p
        className={cn(
          "w-full text-center font-mono text-[0.6875rem] leading-tight tabular-nums",
          remaining >= 0 ? "text-muted-foreground" : "text-negative"
        )}
      >
        <span className="text-negative">
          {formatCurrencyWithBreaks(budget.spent, baseCurrency)}
        </span>
        {" / "}
        {formatCurrencyWithBreaks(budget.limit, baseCurrency)}
      </p>
    </Link>
  );
}

function BudgetPage({
  budgets,
  monthProgress,
  isCurrentMonth,
}: {
  budgets: BudgetPaceItem[];
  monthProgress: number;
  isCurrentMonth: boolean;
}) {
  const layout = resolveRingLayout(budgets.length);
  const count = budgets.length;

  return (
    <div
      className={cn(
        "grid w-full gap-y-3",
        count === 1 && "place-items-center"
      )}
      style={
        count > 1
          ? { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }
          : undefined
      }
      role="list"
    >
      {budgets.map((budget) => (
        <BudgetRing
          key={budget.id}
          budget={budget}
          monthProgress={monthProgress}
          isCurrentMonth={isCurrentMonth}
          layout={layout}
        />
      ))}
    </div>
  );
}

interface BudgetPaceChartProps {
  budgets: BudgetPaceItem[];
  monthProgress: number;
  isCurrentMonth: boolean;
}

/**
 * Home budget overview: one ring per budget (spent / limit).
 * More than 3 budgets spill into swipeable pages; each page sizes
 * rings by how many budgets are on that page.
 */
export function BudgetPaceChart({
  budgets,
  monthProgress,
  isCurrentMonth,
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
