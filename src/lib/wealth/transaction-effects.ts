/**
 * What each Patrimonio event does to the balance sheet and to the month.
 *
 * This exists so the wizard's "Impacto en tus finanzas" preview and the write
 * that follows it can never drift: both read the same function. The rules it
 * encodes are the ones users get wrong — an opening balance is not income, a
 * transfer is not an expense, recovered principal is not income.
 */

export type WealthEvent =
  /** Recording money that already sits in an account. */
  | "opening_account_balance"
  /** Recording a savings fund that already exists. */
  | "opening_savings"
  /** Recording an investment already held. */
  | "opening_investment"
  /** Recording a receivable that was lent in the past. */
  | "opening_receivable"
  /** Recording a debt that already exists. */
  | "opening_debt"
  /** Moving money from a spending account into a savings fund now. */
  | "move_to_savings"
  /** Buying an investment with cash now. */
  | "buy_investment"
  /** Handing money to somebody now. */
  | "lend_money_now"
  /** Market value moved. */
  | "market_change";

export interface FinancialImpact {
  /** Base-currency deltas. `null` means "not applicable to this event". */
  assets: number;
  liabilities: number;
  netWorth: number;
  available: number;
  /** Effect on this month's income/expense totals — almost always zero. */
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface ImpactInput {
  event: WealthEvent;
  /** Positive magnitude of the thing being recorded, in base currency. */
  amount: number;
  /** Whether the destination counts toward spendable money. */
  includeInAvailable?: boolean;
  /** For an investment: value − contributed cost. */
  unrealizedGain?: number;
}

const ZERO: FinancialImpact = {
  assets: 0,
  liabilities: 0,
  netWorth: 0,
  available: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
};

export function resolveFinancialImpact(input: ImpactInput): FinancialImpact {
  const amount = Math.abs(input.amount);
  const available = input.includeInAvailable ?? false;

  switch (input.event) {
    /* Opening snapshots: the money already existed, so nothing happened this
       month. Recording it must never look like income. */
    case "opening_account_balance":
      return {
        ...ZERO,
        assets: amount,
        netWorth: amount,
        available: available ? amount : 0,
      };

    case "opening_savings":
    case "opening_investment":
    case "opening_receivable":
      return {
        ...ZERO,
        assets: amount,
        netWorth: amount,
        available: available ? amount : 0,
      };

    case "opening_debt":
      return { ...ZERO, liabilities: amount, netWorth: -amount };

    /* Transfers: money changes shape, not quantity. Total assets and net worth
       are unchanged; only spendability moves. */
    case "move_to_savings":
    case "buy_investment":
    case "lend_money_now":
      return { ...ZERO, available: available ? 0 : -amount };

    /* A market gain raises net worth but is not salary. */
    case "market_change":
      return {
        ...ZERO,
        assets: input.unrealizedGain ?? 0,
        netWorth: input.unrealizedGain ?? 0,
      };

    default:
      return ZERO;
  }
}

/** True when the event leaves total assets and net worth untouched. */
export function isTransfer(event: WealthEvent) {
  return (
    event === "move_to_savings" ||
    event === "buy_investment" ||
    event === "lend_money_now"
  );
}
