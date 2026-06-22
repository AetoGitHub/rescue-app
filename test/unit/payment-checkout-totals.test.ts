import { describe, expect, it } from 'vitest';
import type { PaymentDebtItem } from '../../app/interfaces/payment/debt';
import type { PaymentListItem } from '../../app/interfaces/payment/payment-list';
import {
  computeCheckoutCartLineAmount,
  computeCheckoutGrandTotal,
} from '../../app/utils/payment-checkout-totals';

function cartItem(
  overrides: Partial<PaymentListItem> = {},
): PaymentListItem {
  return {
    id: 1,
    rescue_folio: 'RES-001',
    amount: '270.00',
    payment: false,
    is_penalty: false,
    created_at: '2026-06-19T20:54:26Z',
    client_name: 'Acme',
    awn_date: null,
    ...overrides,
  };
}

function debtItem(overrides: Partial<PaymentDebtItem> = {}): PaymentDebtItem {
  return {
    id: 10,
    rescue_folio: 'RES-010',
    user_id: 2,
    user_name: 'Juan',
    amount: '100.00',
    payment: false,
    source: 'cancelled',
    comment: null,
    created_at: '2026-06-15T08:30:00Z',
    ...overrides,
  };
}

describe('payment-checkout-totals', () => {
  it('computeCheckoutCartLineAmount subtracts penalty when forgiven', () => {
    const item = cartItem({
      is_penalty: true,
      amount: '270.00',
      penalty_amount: '70.00',
    });

    expect(computeCheckoutCartLineAmount(item, false)).toBe(270);
    expect(computeCheckoutCartLineAmount(item, true)).toBe(200);
  });

  it('computeCheckoutGrandTotal subtracts non-forgiven debts from cart subtotal', () => {
    const total = computeCheckoutGrandTotal({
      cartItems: [cartItem({ id: 1, amount: '300.00' })],
      debts: [debtItem({ id: 10, amount: '100.00' })],
      forgivenCartIds: new Set(),
      forgivenDebtIds: new Set(),
    });

    expect(total).toBe(200);
  });

  it('computeCheckoutGrandTotal ignores forgiven debts', () => {
    const total = computeCheckoutGrandTotal({
      cartItems: [cartItem({ id: 1, amount: '300.00' })],
      debts: [debtItem({ id: 10, amount: '100.00' })],
      forgivenCartIds: new Set(),
      forgivenDebtIds: new Set([10]),
    });

    expect(total).toBe(300);
  });
});
