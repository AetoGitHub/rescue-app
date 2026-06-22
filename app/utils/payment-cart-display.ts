import type { PaymentCartResponse } from '~/interfaces/payment/cart';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import type { PaymentRecipientType } from '~/constants/payment-api';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export interface PaymentCartCheckoutRow extends PaymentListItem {
  recipientType: PaymentRecipientType;
}

export function paymentCartGrandTotal(cart: PaymentCartResponse): number {
  return (
    parseRescueCardMoney(cart.operative.total_amount)
    + parseRescueCardMoney(cart.seller.total_amount)
  );
}

export function paymentCartItemCount(cart: PaymentCartResponse): number {
  return cart.operative.count + cart.seller.count;
}

export function flattenPaymentCartItems(
  cart: PaymentCartResponse,
): PaymentCartCheckoutRow[] {
  const operativeRows = cart.operative.items.map((item) => ({
    ...item,
    recipientType: 'operative' as const,
  }));

  const sellerRows = cart.seller.items.map((item) => ({
    ...item,
    recipientType: 'seller' as const,
  }));

  return [...operativeRows, ...sellerRows];
}
