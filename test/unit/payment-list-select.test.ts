import { describe, expect, it } from 'vitest';
import type { PaymentListItem } from '../../app/interfaces/payment/payment-list';
import {
  isPaymentListItemPaid,
  isPaymentListRowSelectable,
  normalizePaymentListItem,
} from '../../app/utils/payment-list-query';

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

describe('isPaymentListItemPaid', () => {
  it('detects boolean and string payment flags', () => {
    expect(isPaymentListItemPaid(paymentListItem({ payment: true }))).toBe(true);
    expect(isPaymentListItemPaid(paymentListItem({ payment: false }))).toBe(
      false,
    );
    expect(
      isPaymentListItemPaid(
        paymentListItem({ payment: 'true' as unknown as boolean }),
      ),
    ).toBe(true);
    expect(
      isPaymentListItemPaid(
        paymentListItem({ payment: 'false' as unknown as boolean }),
      ),
    ).toBe(false);
  });

  it('uses paid_at when payment flag is missing', () => {
    expect(
      isPaymentListItemPaid(
        paymentListItem({
          payment: null as unknown as boolean,
          paid_at: '2026-06-20T12:00:00Z',
        }),
      ),
    ).toBe(true);
  });
});

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

describe('normalizePaymentListItem', () => {
  it('normalizes payment to boolean using paid_at fallback', () => {
    expect(
      normalizePaymentListItem(
        paymentListItem({
          payment: null as unknown as boolean,
          paid_at: '2026-06-20T12:00:00Z',
        }),
      ).payment,
    ).toBe(true);
  });
});
