import type { Database } from "@/types/database";

export const POPULAR_BROKERS = [
  "Interactive Brokers",
  "Hapi",
  "Trii",
  "Fidelity",
  "Charles Schwab",
  "Robinhood",
  "eToro",
  "Trading 212",
  "DEGIRO",
  "XTB",
  "Alpaca",
] as const;
export const CUSTOM_BROKER_VALUE = "__custom_broker__";
export const SAVINGS_COUNTRY_CODES = ["CO", "ES"] as const;
export const SAVINGS_PRODUCT_TYPES = [
  "savings_account",
  "checking_account",
  "fiduciary_account",
] as const;

export const SAVINGS_BANK_CATALOG = {
  CO: [
    {
      bankCode: "bancolombia",
      bankName: "Bancolombia",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "COP",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "COP",
        },
        {
          productType: "fiduciary_account",
          productName: "Fiducuenta",
          defaultCurrency: "COP",
        },
      ],
    },
    {
      bankCode: "davivienda",
      bankName: "Davivienda",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "COP",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "COP",
        },
      ],
    },
    {
      bankCode: "banco_de_bogota",
      bankName: "Banco de Bogota",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "COP",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "COP",
        },
      ],
    },
  ],
  ES: [
    {
      bankCode: "santander",
      bankName: "Santander",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "EUR",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "EUR",
        },
      ],
    },
    {
      bankCode: "bbva",
      bankName: "BBVA",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "EUR",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "EUR",
        },
      ],
    },
    {
      bankCode: "caixabank",
      bankName: "CaixaBank",
      products: [
        {
          productType: "savings_account",
          productName: "Cuenta de ahorro",
          defaultCurrency: "EUR",
        },
        {
          productType: "checking_account",
          productName: "Cuenta corriente",
          defaultCurrency: "EUR",
        },
      ],
    },
  ],
} as const;
export const FEE_MODES = [
  "manual",
  "percent",
  "fixed",
  "percent_plus_fixed",
] as const;
export const ASSET_TYPES = ["stock", "etf", "crypto"] as const;
export const MARKET_CODES = ["US", "CO", "CRYPTO"] as const;
export const TRADE_SIDES = ["buy", "sell"] as const;
export const MOVEMENT_TYPES = ["deposit", "withdrawal"] as const;
export const REFERENCE_STATUSES = [
  "fetched",
  "fallback_previous_trading_day",
  "unavailable",
  "manual_only",
] as const;

export type BrokerKind = string;
export type SavingsCountryCode = (typeof SAVINGS_COUNTRY_CODES)[number];
export type SavingsProductType = (typeof SAVINGS_PRODUCT_TYPES)[number];
export type FeeMode = (typeof FEE_MODES)[number];
export type AssetType = (typeof ASSET_TYPES)[number];
export type MarketCode = (typeof MARKET_CODES)[number];
export type TradeSide = (typeof TRADE_SIDES)[number];
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

export type BrokerageAccountRow =
  Database["public"]["Tables"]["brokerage_accounts"]["Row"];
export type InvestmentAssetRow =
  Database["public"]["Tables"]["investment_assets"]["Row"];
export type InvestmentTradeRow =
  Database["public"]["Tables"]["investment_trades"]["Row"];
export type InvestmentCashMovementRow =
  Database["public"]["Tables"]["investment_cash_movements"]["Row"];
export type InvestmentWatchlistRow =
  Database["public"]["Tables"]["investment_watchlist"]["Row"];
export type InvestmentSavingsAccountRow =
  Database["public"]["Tables"]["investment_savings_accounts"]["Row"];
export type InvestmentSavingsTransferRow =
  Database["public"]["Tables"]["investment_savings_transfers"]["Row"];

export type InvestmentTradeWithJoins = InvestmentTradeRow & {
  brokerage_accounts: BrokerageAccountRow;
  investment_assets: InvestmentAssetRow;
};

export type InvestmentCashMovementWithJoins = InvestmentCashMovementRow & {
  brokerage_accounts: BrokerageAccountRow;
};

export type InvestmentWatchlistWithJoins = InvestmentWatchlistRow & {
  investment_assets: InvestmentAssetRow;
};

export type InvestmentSavingsTransferWithJoins = InvestmentSavingsTransferRow & {
  investment_savings_accounts: InvestmentSavingsAccountRow;
};

export type SavingsBankCatalogEntry =
  (typeof SAVINGS_BANK_CATALOG)["CO"][number] |
  (typeof SAVINGS_BANK_CATALOG)["ES"][number];

export type SavingsProductCatalogEntry = SavingsBankCatalogEntry["products"][number];

export interface MarketPriceResponse {
  symbol: string;
  assetType: AssetType;
  marketCode: MarketCode;
  requestedDate: string | null;
  resolvedDate: string | null;
  close: number | null;
  currency: string | null;
  source: string | null;
  status: ReferenceStatus;
  cached: boolean;
}

export interface LatestQuote extends MarketPriceResponse {
  assetKey: string;
}

export interface HoldingSummary {
  assetId: string;
  assetKey: string;
  symbol: string;
  displayName: string | null;
  assetType: AssetType;
  marketCode: MarketCode;
  exchangeCode: string | null;
  quoteCurrency: string;
  quantity: number;
  costBasis: number;
  avgCost: number;
  latestPrice: number | null;
  latestCurrency: string;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  accountCount: number;
  priceStatus: ReferenceStatus;
  priceSource: string | null;
  asOfDate: string | null;
}

export interface AccountCashSummary {
  accountId: string;
  name: string;
  brokerKind: BrokerKind;
  estimatedCash: number;
  netContributions: number;
}

export interface InvestmentOverview {
  holdings: HoldingSummary[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  openPositionsCount: number;
  watchlistCount: number;
  trackedAssetsCount: number;
  netContributions: number;
  estimatedCash: number;
  accountSummaries: AccountCashSummary[];
}

interface AssetInput {
  symbol: string;
  display_name?: string | null;
  asset_type: AssetType;
  market_code: MarketCode;
  exchange_code?: string | null;
  quote_currency?: string | null;
  provider_symbol_twelve?: string | null;
  provider_symbol_eodhd?: string | null;
  is_price_supported?: boolean;
}

interface Lot {
  remainingQuantity: number;
  unitCostBase: number;
}

function cleanNullable(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeBrokerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getSavingsBanks(countryCode: SavingsCountryCode) {
  return [...SAVINGS_BANK_CATALOG[countryCode]].sort((left, right) =>
    left.bankName.localeCompare(right.bankName)
  );
}

export function findSavingsBank(
  countryCode: SavingsCountryCode,
  bankCode: string
) {
  return SAVINGS_BANK_CATALOG[countryCode].find((bank) => bank.bankCode === bankCode);
}

export function getSavingsProducts(
  countryCode: SavingsCountryCode,
  bankCode: string
) {
  const bank = findSavingsBank(countryCode, bankCode);
  if (!bank) return [];

  return [...bank.products];
}

export function buildSavingsAccountLabel(input: {
  bankName: string;
  productName: string;
  accountName: string;
}) {
  const accountName = input.accountName.trim();
  if (accountName.length === 0) {
    return `${input.bankName} - ${input.productName}`;
  }

  return `${input.bankName} - ${input.productName} (${accountName})`;
}

export function buildBrokerChoices(
  accounts: Array<Pick<BrokerageAccountRow, "broker_kind">>
) {
  const choices = new Map<string, string>();

  POPULAR_BROKERS.forEach((broker) => {
    choices.set(broker.toLowerCase(), broker);
  });

  accounts.forEach((account) => {
    const brokerName = normalizeBrokerName(account.broker_kind);
    if (brokerName.length > 0) {
      choices.set(brokerName.toLowerCase(), brokerName);
    }
  });

  return Array.from(choices.values()).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function buildAssetKey(
  marketCode: MarketCode,
  symbol: string,
  exchangeCode?: string | null
) {
  return `${marketCode}:${(cleanNullable(exchangeCode) ?? "NA").toUpperCase()}:${symbol
    .trim()
    .toUpperCase()}`;
}

export function getDefaultQuoteCurrency(marketCode: MarketCode) {
  if (marketCode === "CO") return "COP";
  return "USD";
}

export function getDefaultTwelveSymbol(
  symbol: string,
  marketCode: MarketCode,
  assetType: AssetType
) {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return null;

  if (marketCode === "CRYPTO" && assetType === "crypto") {
    return `${normalized}/USD`;
  }

  if (marketCode === "US") {
    return normalized;
  }

  return null;
}

export function normalizeInvestmentAsset(input: AssetInput) {
  const symbol = input.symbol.trim().toUpperCase();
  const marketCode = input.market_code;
  const exchangeCode = cleanNullable(input.exchange_code)?.toUpperCase();
  const quoteCurrency = (
    cleanNullable(input.quote_currency) ?? getDefaultQuoteCurrency(marketCode)
  ).toUpperCase();
  const providerSymbolTwelve =
    cleanNullable(input.provider_symbol_twelve) ??
    getDefaultTwelveSymbol(symbol, marketCode, input.asset_type);
  const providerSymbolEodhd = cleanNullable(input.provider_symbol_eodhd);
  const priceSupported =
    input.is_price_supported ??
    (marketCode !== "CO" ||
      providerSymbolEodhd !== null ||
      providerSymbolTwelve !== null);

  return {
    asset_key: buildAssetKey(marketCode, symbol, exchangeCode),
    symbol,
    display_name: cleanNullable(input.display_name),
    asset_type: input.asset_type,
    market_code: marketCode,
    exchange_code: exchangeCode,
    quote_currency: quoteCurrency,
    provider_symbol_twelve: providerSymbolTwelve,
    provider_symbol_eodhd: providerSymbolEodhd,
    is_price_supported: priceSupported,
  };
}

export function estimateTradeFee(
  account: Pick<
    BrokerageAccountRow,
    "fee_mode" | "fee_percent" | "fee_fixed_amount" | "fee_min_amount"
  >,
  grossTradeValue: number
) {
  const percentFee = grossTradeValue * (Number(account.fee_percent) / 100);
  let estimated = 0;

  if (account.fee_mode === "percent") {
    estimated = percentFee;
  } else if (account.fee_mode === "fixed") {
    estimated = Number(account.fee_fixed_amount);
  } else if (account.fee_mode === "percent_plus_fixed") {
    estimated = percentFee + Number(account.fee_fixed_amount);
  }

  return Math.max(estimated, Number(account.fee_min_amount));
}

function sortTrades(trades: InvestmentTradeWithJoins[]) {
  return [...trades].sort((left, right) => {
    const dateCompare = left.trade_date.localeCompare(right.trade_date);
    if (dateCompare !== 0) return dateCompare;
    const createdCompare = left.created_at.localeCompare(right.created_at);
    if (createdCompare !== 0) return createdCompare;
    return left.id.localeCompare(right.id);
  });
}

export function buildInvestmentOverview({
  trades,
  cashMovements,
  watchlist,
  latestQuotes,
  convert,
}: {
  trades: InvestmentTradeWithJoins[];
  cashMovements: InvestmentCashMovementWithJoins[];
  watchlist: InvestmentWatchlistWithJoins[];
  latestQuotes: Record<string, LatestQuote>;
  convert: (amount: number, fromCurrency: string) => number;
}): InvestmentOverview {
  const groupedTrades = new Map<string, InvestmentTradeWithJoins[]>();
  const accountCash = new Map<
    string,
    {
      name: string;
      brokerKind: BrokerKind;
      estimatedCash: number;
      netContributions: number;
    }
  >();

  for (const movement of cashMovements) {
    const signedAmount =
      movement.movement_type === "deposit"
        ? Number(movement.amount)
        : -Number(movement.amount);
    const feeBase = convert(Number(movement.fee_amount), movement.fee_currency);
    const amountBase = convert(signedAmount, movement.currency) - feeBase;
    const existing = accountCash.get(movement.account_id) ?? {
      name: movement.brokerage_accounts.name,
      brokerKind: movement.brokerage_accounts.broker_kind as BrokerKind,
      estimatedCash: 0,
      netContributions: 0,
    };
    existing.estimatedCash += amountBase;
    existing.netContributions += amountBase;
    accountCash.set(movement.account_id, existing);
  }

  for (const trade of trades) {
    const existing = groupedTrades.get(trade.asset_id) ?? [];
    existing.push(trade);
    groupedTrades.set(trade.asset_id, existing);

    const gross = Number(trade.quantity) * Number(trade.execution_price);
    const grossBase = convert(gross, trade.execution_currency);
    const feeBase = convert(Number(trade.fee_amount), trade.fee_currency);
    const accountSummary = accountCash.get(trade.account_id) ?? {
      name: trade.brokerage_accounts.name,
      brokerKind: trade.brokerage_accounts.broker_kind as BrokerKind,
      estimatedCash: 0,
      netContributions: 0,
    };

    if (trade.side === "buy") {
      accountSummary.estimatedCash -= grossBase + feeBase;
    } else {
      accountSummary.estimatedCash += grossBase - feeBase;
    }

    accountCash.set(trade.account_id, accountSummary);
  }

  const holdings: HoldingSummary[] = [];
  let totalMarketValue = 0;
  let totalCostBasis = 0;
  let totalUnrealizedPnl = 0;
  let totalRealizedPnl = 0;

  groupedTrades.forEach((assetTrades, assetId) => {
    const sorted = sortTrades(assetTrades);
    const asset = sorted[0].investment_assets;
    const lots: Lot[] = [];
    let realizedPnl = 0;
    const accounts = new Set<string>();

    for (const trade of sorted) {
      accounts.add(trade.account_id);
      const quantity = Number(trade.quantity);
      const grossBase = convert(
        quantity * Number(trade.execution_price),
        trade.execution_currency
      );
      const feeBase = convert(Number(trade.fee_amount), trade.fee_currency);

      if (trade.side === "buy") {
        lots.push({
          remainingQuantity: quantity,
          unitCostBase: (grossBase + feeBase) / quantity,
        });
        continue;
      }

      let remainingToSell = quantity;
      let matchedCostBasis = 0;

      while (remainingToSell > 0 && lots.length > 0) {
        const currentLot = lots[0];
        const matchedQuantity = Math.min(
          currentLot.remainingQuantity,
          remainingToSell
        );

        matchedCostBasis += matchedQuantity * currentLot.unitCostBase;
        currentLot.remainingQuantity -= matchedQuantity;
        remainingToSell -= matchedQuantity;

        if (currentLot.remainingQuantity <= 0.00000001) {
          lots.shift();
        }
      }

      const proceedsBase = grossBase - feeBase;
      realizedPnl += proceedsBase - matchedCostBasis;
    }

    const quantity = lots.reduce(
      (sum, lot) => sum + lot.remainingQuantity,
      0
    );

    totalRealizedPnl += realizedPnl;

    if (quantity <= 0.00000001) {
      return;
    }

    const costBasis = lots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.unitCostBase,
      0
    );
    const latestQuote = latestQuotes[asset.asset_key];
    const lastTrade = sorted[sorted.length - 1];
    const latestPrice =
      latestQuote?.close ?? Number(lastTrade.execution_price) ?? null;
    const latestCurrency =
      latestQuote?.currency ?? lastTrade.execution_currency;
    const marketValue =
      latestPrice === null ? costBasis : convert(quantity * latestPrice, latestCurrency);
    const unrealizedPnl = marketValue - costBasis;
    const avgCost = quantity > 0 ? costBasis / quantity : 0;

    totalMarketValue += marketValue;
    totalCostBasis += costBasis;
    totalUnrealizedPnl += unrealizedPnl;

    holdings.push({
      assetId,
      assetKey: asset.asset_key,
      symbol: asset.symbol,
      displayName: asset.display_name,
      assetType: asset.asset_type as AssetType,
      marketCode: asset.market_code as MarketCode,
      exchangeCode: asset.exchange_code,
      quoteCurrency: asset.quote_currency,
      quantity,
      costBasis,
      avgCost,
      latestPrice,
      latestCurrency,
      marketValue,
      unrealizedPnl,
      realizedPnl,
      accountCount: accounts.size,
      priceStatus: latestQuote?.status ?? "manual_only",
      priceSource: latestQuote?.source ?? "manual_override",
      asOfDate: latestQuote?.resolvedDate ?? lastTrade.trade_date,
    });
  });

  holdings.sort((left, right) => right.marketValue - left.marketValue);

  const accountSummaries = Array.from(accountCash.entries())
    .map(([accountId, summary]) => ({
      accountId,
      name: summary.name,
      brokerKind: summary.brokerKind,
      estimatedCash: summary.estimatedCash,
      netContributions: summary.netContributions,
    }))
    .sort((left, right) => right.estimatedCash - left.estimatedCash);

  const netContributions = accountSummaries.reduce(
    (sum, account) => sum + account.netContributions,
    0
  );
  const estimatedCash = accountSummaries.reduce(
    (sum, account) => sum + account.estimatedCash,
    0
  );

  const trackedAssetKeys = new Set<string>();
  holdings.forEach((holding) => trackedAssetKeys.add(holding.assetKey));
  watchlist.forEach((item) => trackedAssetKeys.add(item.investment_assets.asset_key));

  return {
    holdings,
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPnl,
    totalRealizedPnl,
    openPositionsCount: holdings.length,
    watchlistCount: watchlist.length,
    trackedAssetsCount: trackedAssetKeys.size,
    netContributions,
    estimatedCash,
    accountSummaries,
  };
}
