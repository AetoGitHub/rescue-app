import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export interface CheckoutTotalsInput {
  cartItems: PaymentListItem[];
  debts: PaymentDebtItem[];
  forgivenCartIds: ReadonlySet<number>;
  forgivenDebtIds: ReadonlySet<number>;
}

export function computeCheckoutCartLineAmount(
  item: PaymentListItem,
  forgivenPenalty: boolean,
): number {
  const amount = parseRescueCardMoney(item.amount);

  if (!item.is_penalty || !forgivenPenalty) {
    return amount;
  }

  const penaltyAmount = parseRescueCardMoney(item.penalty_amount);
  return Math.max(0, amount - penaltyAmount);
}

export function computeCheckoutCartSubtotal(input: CheckoutTotalsInput): number {
  return input.cartItems.reduce((sum, item) => {
    const forgivenPenalty = input.forgivenCartIds.has(item.id);
    return sum + computeCheckoutCartLineAmount(item, forgivenPenalty);
  }, 0);
}

export function computeCheckoutDebtSubtotal(input: CheckoutTotalsInput): number {
  return input.debts.reduce((sum, debt) => {
    if (input.forgivenDebtIds.has(debt.id)) return sum;
    return sum + parseRescueCardMoney(debt.amount);
  }, 0);
}

export function computeCheckoutGrandTotal(input: CheckoutTotalsInput): number {
  const cartSubtotal = computeCheckoutCartSubtotal(input);
  const debtSubtotal = computeCheckoutDebtSubtotal(input);
  return cartSubtotal - debtSubtotal;
}
