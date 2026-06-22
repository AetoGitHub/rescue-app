import { describe, expect, it } from 'vitest';
import { buildPaymentCartQuery } from '../../app/utils/payment-cart-query';

describe('payment-cart-query', () => {
  it('includes test_days only in dev mode', () => {
    expect(buildPaymentCartQuery({ testDays: 8, dev: true })).toEqual({
      test_days: '8',
    });
    expect(buildPaymentCartQuery({ testDays: 8, dev: false })).toEqual({});
  });

  it('omits invalid test_days', () => {
    expect(buildPaymentCartQuery({ testDays: 0, dev: true })).toEqual({});
  });
});
