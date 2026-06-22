import { describe, expect, it } from 'vitest';
import {
  buildPaymentReceiptListQuery,
  paymentReceiptListQueryKey,
} from '../../app/utils/payment-receipt-list-query';

function date(year: number, month: number, day: number) {
  return { year, month, day };
}

describe('payment-receipt-list-query', () => {
  it('buildPaymentReceiptListQuery returns empty object without filters', () => {
    expect(buildPaymentReceiptListQuery({})).toEqual({});
  });

  it('buildPaymentReceiptListQuery maps all filters', () => {
    expect(
      buildPaymentReceiptListQuery({
        paymentType: 'operative',
        userId: 5,
        fromDate: date(2026, 1, 10),
        toDate: date(2026, 2, 20),
      }),
    ).toEqual({
      payment_type: 'operative',
      user: '5',
      from_date: '2026-01-10',
      to_date: '2026-02-20',
    });
  });

  it('paymentReceiptListQueryKey serializes filters', () => {
    expect(
      paymentReceiptListQueryKey({
        paymentType: 'seller',
        userId: 2,
        fromDate: date(2026, 3, 1),
        toDate: null,
      }),
    ).toEqual(['payment-receipt-list', 'seller', 2, '2026-03-01', '']);
  });
});
