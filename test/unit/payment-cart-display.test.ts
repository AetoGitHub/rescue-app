import { describe, expect, it } from 'vitest';
import type { PaymentCartResponse } from '../../app/interfaces/payment/cart';
import {
  flattenPaymentCartItems,
  isInvalidPaymentCart,
  paymentCartGrandTotal,
  paymentCartItemCount,
  resolveActivePaymentCart,
  resolvePaymentCartRecipientSummary,
} from '../../app/utils/payment-cart-display';

function buildOperativeCart(
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
      count: 0,
      total_amount: '0',
      items: [],
    },
    ...overrides,
  };
}

function buildInvalidMixedCart(): PaymentCartResponse {
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
  };
}

describe('payment-cart-display', () => {
  it('resolveActivePaymentCart returns operative section when only operative has items', () => {
    const cart = buildOperativeCart();
    expect(resolveActivePaymentCart(cart)).toEqual({
      type: 'operative',
      section: cart.operative,
    });
  });

  it('resolveActivePaymentCart returns seller section when only seller has items', () => {
    const cart = buildOperativeCart({
      operative: { count: 0, total_amount: '0', items: [] },
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
    });

    expect(resolveActivePaymentCart(cart)).toEqual({
      type: 'seller',
      section: cart.seller,
    });
  });

  it('resolveActivePaymentCart returns null when cart is empty', () => {
    const cart = buildOperativeCart({
      operative: { count: 0, total_amount: '0', items: [] },
    });

    expect(resolveActivePaymentCart(cart)).toBeNull();
  });

  it('resolveActivePaymentCart marks invalid when both sections have items', () => {
    const resolved = resolveActivePaymentCart(buildInvalidMixedCart());
    expect(isInvalidPaymentCart(resolved)).toBe(true);
  });

  it('paymentCartGrandTotal and paymentCartItemCount use active section only', () => {
    const cart = buildOperativeCart();
    expect(paymentCartGrandTotal(cart)).toBe(100);
    expect(paymentCartItemCount(cart)).toBe(1);
  });

  it('flattenPaymentCartItems returns active section rows with recipientType', () => {
    const rows = flattenPaymentCartItems(buildOperativeCart());

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 1,
      recipientType: 'operative',
      operator_name: 'Operador A',
    });
  });

  it('flattenPaymentCartItems returns empty array when cart is empty or invalid', () => {
    const emptyCart = buildOperativeCart({
      operative: { count: 0, total_amount: '0', items: [] },
    });

    expect(flattenPaymentCartItems(emptyCart)).toEqual([]);
    expect(paymentCartGrandTotal(emptyCart)).toBe(0);
    expect(paymentCartItemCount(emptyCart)).toBe(0);
    expect(flattenPaymentCartItems(buildInvalidMixedCart())).toEqual([]);
    expect(paymentCartGrandTotal(buildInvalidMixedCart())).toBe(0);
  });

  it('resolvePaymentCartRecipientSummary returns active profile', () => {
    expect(resolvePaymentCartRecipientSummary(buildOperativeCart())).toEqual({
      type: 'operative',
      userName: 'Operador A',
    });
  });

  it('resolvePaymentCartRecipientSummary returns null for invalid cart', () => {
    expect(
      resolvePaymentCartRecipientSummary(buildInvalidMixedCart()),
    ).toBeNull();
  });
});
