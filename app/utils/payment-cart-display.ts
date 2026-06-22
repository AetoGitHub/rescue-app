import type { PaymentCartSection } from '~/interfaces/payment/cart';
import type { PaymentCartResponse } from '~/interfaces/payment/cart';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import type { PaymentRecipientType } from '~/constants/payment-api';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export interface PaymentCartCheckoutRow extends PaymentListItem {
  recipientType: PaymentRecipientType;
}

export interface PaymentCartRecipientSummary {
  type: PaymentRecipientType;
  userName: string;
}

export interface ActivePaymentCart {
  type: PaymentRecipientType;
  section: PaymentCartSection;
}

export interface InvalidPaymentCart {
  invalid: true;
}

export type ResolvedPaymentCart = ActivePaymentCart | InvalidPaymentCart | null;

export function paymentCheckoutRecipientLabel(
  type: PaymentRecipientType,
): string {
  return type === 'operative' ? 'Operador' : 'Vendedor';
}

export function paymentCheckoutRecipientSectionLabel(
  type: PaymentRecipientType,
): string {
  return type === 'operative' ? 'Operadores' : 'Vendedores';
}

export function isInvalidPaymentCart(
  resolved: ResolvedPaymentCart,
): resolved is InvalidPaymentCart {
  return resolved != null && 'invalid' in resolved;
}

export function resolveActivePaymentCart(
  cart: PaymentCartResponse,
): ResolvedPaymentCart {
  const hasOperative = cart.operative.count > 0;
  const hasSeller = cart.seller.count > 0;

  if (hasOperative && hasSeller) {
    return { invalid: true };
  }

  if (hasOperative) {
    return { type: 'operative', section: cart.operative };
  }

  if (hasSeller) {
    return { type: 'seller', section: cart.seller };
  }

  return null;
}

function resolveSectionRecipientName(
  items: PaymentListItem[],
  type: PaymentRecipientType,
): string {
  for (const item of items) {
    const name =
      type === 'operative'
        ? item.operator_name?.trim()
        : item.seller_name?.trim() ?? item.operator_name?.trim();
    if (name) return name;
  }

  return paymentCheckoutRecipientLabel(type);
}

export function resolvePaymentCartRecipientSummary(
  cart: PaymentCartResponse,
): PaymentCartRecipientSummary | null {
  const active = resolveActivePaymentCart(cart);
  if (active == null || isInvalidPaymentCart(active)) return null;

  return {
    type: active.type,
    userName: resolveSectionRecipientName(active.section.items, active.type),
  };
}

export function paymentCartGrandTotal(cart: PaymentCartResponse): number {
  const active = resolveActivePaymentCart(cart);
  if (active == null || isInvalidPaymentCart(active)) return 0;
  return parseRescueCardMoney(active.section.total_amount);
}

export function paymentCartItemCount(cart: PaymentCartResponse): number {
  const active = resolveActivePaymentCart(cart);
  if (active == null || isInvalidPaymentCart(active)) return 0;
  return active.section.count;
}

export function flattenPaymentCartItems(
  cart: PaymentCartResponse,
): PaymentCartCheckoutRow[] {
  const active = resolveActivePaymentCart(cart);
  if (active == null || isInvalidPaymentCart(active)) return [];

  return active.section.items.map((item) => ({
    ...item,
    recipientType: active.type,
  }));
}

export function resolveCartDebtVoucherItems(
  cart: PaymentCartResponse,
): PaymentDebtItem[] {
  return cart.debt_voucher?.items ?? [];
}
