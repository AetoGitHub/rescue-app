import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import type {
  PaymentReceiptOperativeItem,
  PaymentReceiptSellerItem,
} from '~/interfaces/payment/receipt';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export function computeReceiptOperativeLineAmount(
  item: PaymentReceiptOperativeItem,
): number {
  const amount = parseRescueCardMoney(item.amount);

  if (!item.is_penalty) {
    return amount;
  }

  if (item.penalty_forgiven) {
    return amount;
  }

  return parseRescueCardMoney(item.penalty_amount);
}

export function computeReceiptCommissionSubtotal(
  operative: PaymentReceiptOperativeItem[],
  seller: PaymentReceiptSellerItem[],
): number {
  const operativeTotal = operative.reduce(
    (sum, item) => sum + computeReceiptOperativeLineAmount(item),
    0,
  );
  const sellerTotal = seller.reduce(
    (sum, item) => sum + parseRescueCardMoney(item.amount),
    0,
  );

  return operativeTotal + sellerTotal;
}

export function computeReceiptDebtSubtotal(debt: PaymentDebtItem[]): number {
  return debt.reduce(
    (sum, item) => sum + parseRescueCardMoney(item.amount),
    0,
  );
}
