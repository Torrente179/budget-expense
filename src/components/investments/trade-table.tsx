"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, ReceiptText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { TradeForm } from "@/components/investments/trade-form";
import type {
  InvestmentTradeWithJoins,
  MarketPriceResponse,
} from "@/lib/investments";
import type { InvestmentTradeFormValues } from "@/lib/validations";

interface BrokerageAccountOption {
  id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_mode: string;
  fee_percent: number;
  fee_fixed_amount: number;
  fee_min_amount: number;
  fee_currency: string;
}

interface TradeTableProps {
  trades: InvestmentTradeWithJoins[];
  accounts: BrokerageAccountOption[];
  loading: boolean;
  lookupPrice: (params: {
    asset: InvestmentTradeFormValues["asset"];
    date?: string;
  }) => Promise<MarketPriceResponse | null>;
  onUpdate: (id: string, values: InvestmentTradeFormValues) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function TradeTable({
  trades,
  accounts,
  loading,
  lookupPrice,
  onUpdate,
  onDelete,
}: TradeTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await onDelete(deleteId);
    setDeleting(false);
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-[1.5rem] border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No orders yet"
        description="Store your first buy or sell order to start building the investment ledger."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="rounded-[1.5rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.84)]"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      trade.side === "buy"
                        ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-300"
                        : "rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-300"
                    }
                  >
                    {trade.side}
                  </span>
                  <p className="text-base font-medium text-foreground">
                    {trade.investment_assets.symbol}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {trade.investment_assets.display_name ?? trade.brokerage_accounts.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(trade.trade_date, "MMM d, yyyy")}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                  <span>{trade.brokerage_accounts.name}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                  <span>
                    {Number(trade.quantity).toFixed(
                      trade.investment_assets.asset_type === "crypto" ? 6 : 4
                    )}{" "}
                    units
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Fill:{" "}
                    <span className="font-mono text-foreground">
                      {Number(trade.execution_price).toFixed(4)} {trade.execution_currency}
                    </span>
                  </span>
                  <span>
                    Fee:{" "}
                    <span className="font-mono text-foreground">
                      {Number(trade.fee_amount).toFixed(4)} {trade.fee_currency}
                    </span>
                  </span>
                  <span>Reference: {trade.reference_status.replaceAll("_", " ")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                <CurrencyDisplay
                  amount={Number(trade.quantity) * Number(trade.execution_price)}
                  currency={trade.execution_currency}
                  showOriginal
                  className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]"
                />
                <div className="flex items-center gap-1">
                  <TradeForm
                    accounts={accounts}
                    lookupPrice={lookupPrice}
                    defaultValues={{
                      account_id: trade.account_id,
                      asset: {
                        symbol: trade.investment_assets.symbol,
                        display_name: trade.investment_assets.display_name ?? "",
                        asset_type: trade.investment_assets.asset_type as "stock" | "etf" | "crypto",
                        market_code: trade.investment_assets.market_code as "US" | "CO" | "CRYPTO",
                        exchange_code: trade.investment_assets.exchange_code ?? "",
                        quote_currency: trade.investment_assets.quote_currency,
                        provider_symbol_twelve:
                          trade.investment_assets.provider_symbol_twelve ?? "",
                        provider_symbol_eodhd:
                          trade.investment_assets.provider_symbol_eodhd ?? "",
                        is_price_supported: trade.investment_assets.is_price_supported,
                      },
                      side: trade.side as "buy" | "sell",
                      trade_date: trade.trade_date,
                      quantity: Number(trade.quantity),
                      execution_price: Number(trade.execution_price),
                      execution_currency: trade.execution_currency,
                      fee_amount: Number(trade.fee_amount),
                      fee_currency: trade.fee_currency,
                      notes: trade.notes ?? "",
                      reference_close_price: trade.reference_close_price
                        ? Number(trade.reference_close_price)
                        : null,
                      reference_close_currency: trade.reference_close_currency,
                      reference_price_date: trade.reference_price_date,
                      reference_source: trade.reference_source,
                      reference_status: trade.reference_status as InvestmentTradeFormValues["reference_status"],
                    }}
                    onSubmit={(values) => onUpdate(trade.id, values)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(trade.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[1.75rem] border-border/70 bg-popover/96 p-5">
          <DialogHeader className="space-y-3">
            <DialogTitle>Delete order</DialogTitle>
            <DialogDescription>
              This will recompute holdings and FIFO realized profit or loss
              automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
