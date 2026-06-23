import { describe, expect, it } from 'vitest';
import type { PaymentListItem } from '../../app/interfaces/payment/payment-list';
import { isPaymentListRowSelectable } from '../../app/utils/payment-list-query';

function paymentListItem(
  overrides: Partial<PaymentListItem> = {},
): PaymentListItem {
  return {
    id: 1,
    rescue_folio: 'RES-001',
    amount: '100.00',
    payment: false,
    is_penalty: false,
    created_at: '2026-06-19T20:54:26Z',
    client_name: 'Acme',
    awn_date: null,
    ...overrides,
  };
}

describe('isPaymentListRowSelectable', () => {
  it('returns true for pending items', () => {
    expect(isPaymentListRowSelectable(paymentListItem({ payment: false }))).toBe(
      true,
    );
  });

  it('returns false for paid items', () => {
    expect(isPaymentListRowSelectable(paymentListItem({ payment: true }))).toBe(
      false,
    );
  });
});
