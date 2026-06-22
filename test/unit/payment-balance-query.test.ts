import { describe, expect, it } from 'vitest';
import {
  buildOperativeBalanceQuery,
  parsePositiveIntQuery,
} from '../../shared/utils/payment-balance-query';

describe('payment-balance-query', () => {
  it('parsePositiveIntQuery accepts positive integers', () => {
    expect(parsePositiveIntQuery('8')).toBe(8);
    expect(parsePositiveIntQuery(8)).toBe(8);
    expect(parsePositiveIntQuery('0')).toBeNull();
    expect(parsePositiveIntQuery('-1')).toBeNull();
    expect(parsePositiveIntQuery('abc')).toBeNull();
  });

  it('buildOperativeBalanceQuery requires operator', () => {
    expect(buildOperativeBalanceQuery({}, { dev: true })).toBeNull();
    expect(buildOperativeBalanceQuery({ operator: ' ' }, { dev: true })).toBeNull();
  });

  it('includes test_days in dev mode', () => {
    expect(
      buildOperativeBalanceQuery(
        { operator: '42', test_days: '8' },
        { dev: true },
      ),
    ).toEqual({
      operator: '42',
      test_days: '8',
    });
  });

  it('omits test_days in production mode', () => {
    expect(
      buildOperativeBalanceQuery(
        { operator: '42', test_days: '8' },
        { dev: false },
      ),
    ).toEqual({
      operator: '42',
    });
  });
});
