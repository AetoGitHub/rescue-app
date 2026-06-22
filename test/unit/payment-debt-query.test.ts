import { describe, expect, it } from 'vitest';
import { buildPaymentDebtQuery, paymentDebtQueryKey } from '../../app/utils/payment-debt-query';

describe('payment-debt-query', () => {
  it('buildPaymentDebtQuery requires userId', () => {
    expect(buildPaymentDebtQuery({ userId: null })).toBeNull();
  });

  it('buildPaymentDebtQuery maps user and payment filters', () => {
    expect(
      buildPaymentDebtQuery({
        userId: 5,
        payment: false,
        folio: ' RES-1 ',
        source: 'cancelled',
      }),
    ).toEqual({
      user: '5',
      payment: 'false',
      folio: 'RES-1',
      source: 'cancelled',
    });
  });

  it('paymentDebtQueryKey serializes filters', () => {
    expect(
      paymentDebtQueryKey({
        userId: 5,
        payment: false,
        folio: 'A',
        source: 'warranty',
      }),
    ).toEqual(['payment-debt', 5, false, 'A', 'warranty', '', '']);
  });
});
