import { describe, expect, it } from 'vitest';
import {
  clientCreditUsagePercent,
  clientTypeBadgeProps,
  formatClientMoney,
  matchesClientTypeFilter,
} from '../../app/utils/client-list-display';

describe('client-list-display', () => {
  it('formats money in MXN', () => {
    expect(formatClientMoney(47436.4)).toContain('$');
    expect(formatClientMoney(null)).toBe('—');
  });

  it('computes credit usage percent', () => {
    expect(clientCreditUsagePercent('2563.60', '50000.00')).toBe(5);
    expect(clientCreditUsagePercent('50000', '50000')).toBe(100);
    expect(clientCreditUsagePercent('0', null)).toBeNull();
    expect(clientCreditUsagePercent('320611.52', '0')).toBe(100);
    expect(clientCreditUsagePercent('0', '0')).toBeNull();
  });

  it('maps client type badges', () => {
    expect(clientTypeBadgeProps('CREDIT').label).toBe('Crédito');
    expect(clientTypeBadgeProps('CASH').color).toBe('info');
    expect(clientTypeBadgeProps('PUBLIC').label).toBe('Público general');
  });

  it('filters client types', () => {
    expect(matchesClientTypeFilter('CREDIT', 'all')).toBe(true);
    expect(matchesClientTypeFilter('CASH', 'CREDIT')).toBe(false);
    expect(matchesClientTypeFilter('PUBLIC', 'PUBLIC')).toBe(true);
  });
});
