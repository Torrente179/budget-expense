"use client";

import { Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { LatestQuote, InvestmentWatchlistWithJoins } from "@/lib/investments";

interface WatchlistGridProps {
  items: InvestmentWatchlistWithJoins[];
  latestQuotes: Record<string, LatestQuote>;
  onDelete: (id: string) => Promise<unknown>;
}

export function WatchlistGrid({
  items,
  latestQuotes,
  onDelete,
}: WatchlistGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No watchlist assets yet"
        description="Add ideas you want to monitor, even before you open a position."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => {
        const quote = latestQuotes[item.investment_assets.asset_key];
        return (
          <Card key={item.id} className="border-border/80 bg-card/96">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">
                    {item.investment_assets.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.investment_assets.display_name ??
                      item.investment_assets.market_code}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                  Latest reference
                </p>
                <p className="mt-3 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em]">
                  {quote?.close
                    ? formatCurrency(quote.close, quote.currency ?? "USD")
                    : "Manual"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {quote?.resolvedDate
                    ? `${quote.source ?? "Provider"} · ${quote.resolvedDate}`
                    : "No automatic quote cached yet"}
                </p>
              </div>

              {item.note && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.note}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
