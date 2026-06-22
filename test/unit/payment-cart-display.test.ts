import { describe, expect, it } from 'vitest';
import type { PaymentCartResponse } from '../../app/interfaces/payment/cart';
import {
  flattenPaymentCartItems,
  paymentCartGrandTotal,
  paymentCartItemCount,
} from '../../app/utils/payment-cart-display';

function buildCart(
  overrides: Partial<PaymentCartResponse> = {},
): PaymentCartResponse {
  return {
    created_at: '2026-06-20T12:00:00Z',
    operative: {
      count: 1,
      total_amount: '100.00',
      items: [
        {
          id: 1,
          rescue_folio: 'RES-001',
          amount: '100.00',
          payment: false,
          is_penalty: false,
          created_at: '2026-06-19T20:54:26Z',
          client_name: 'Acme',
          awn_date: null,
          operator_name: 'Operador A',
        },
      ],
    },
    seller: {
      count: 1,
      total_amount: '50.50',
      items: [
        {
          id: 2,
          rescue_folio: 'RES-002',
          amount: '50.50',
          payment: false,
          is_penalty: false,
          created_at: '2026-06-19T21:00:00Z',
          client_name: 'Beta',
          awn_date: null,
          seller_name: 'Vendedor B',
        },
      ],
    },
    ...overrides,
  };
}

describe('payment-cart-display', () => {
  it('paymentCartGrandTotal sums operative and seller totals', () => {
    expect(paymentCartGrandTotal(buildCart())).toBe(150.5);
  });

  it('paymentCartItemCount sums section counts', () => {
    expect(paymentCartItemCount(buildCart())).toBe(2);
  });

  it('flattenPaymentCartItems merges sections with recipientType', () => {
    const rows = flattenPaymentCartItems(buildCart());

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: 1,
      recipientType: 'operative',
      operator_name: 'Operador A',
    });
    expect(rows[1]).toMatchObject({
      id: 2,
      recipientType: 'seller',
      seller_name: 'Vendedor B',
    });
  });

  it('flattenPaymentCartItems returns empty array when cart is empty', () => {
    const cart = buildCart({
      operative: { count: 0, total_amount: '0', items: [] },
      seller: { count: 0, total_amount: '0', items: [] },
    });

    expect(flattenPaymentCartItems(cart)).toEqual([]);
    expect(paymentCartGrandTotal(cart)).toBe(0);
    expect(paymentCartItemCount(cart)).toBe(0);
  });
});
