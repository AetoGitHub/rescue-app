import { describe, expect, it } from 'vitest';
import {
  formatCommissionPercent,
  paymentListCommissionRate,
} from '../../app/utils/payment-list-display';

describe('payment-list-display', () => {
  it('formatCommissionPercent formats whole and decimal rates', () => {
    expect(formatCommissionPercent('0')).toBe('0%');
    expect(formatCommissionPercent('20.00')).toBe('20%');
    expect(formatCommissionPercent('12.50')).toBe('12.5%');
    expect(formatCommissionPercent(null)).toBe('0%');
  });

  it('paymentListCommissionRate prefers profile-specific commission field', () => {
    expect(
      paymentListCommissionRate(
        { operator_commission: '20.00', seller_commission: '15.00' },
        'operative',
      ),
    ).toBe('20%');

    expect(
      paymentListCommissionRate(
        { operator_commission: '20.00', seller_commission: '15.00' },
        'seller',
      ),
    ).toBe('15%');
  });
});
