import { describe, expect, it } from 'vitest';
import {
  formatUserCommissionPercent,
  mapUserDetail,
} from '../../app/utils/user-detail-map';

describe('mapUserDetail', () => {
  it('loads API fraction 0.7 into the form as 70.00', () => {
    const state = mapUserDetail({
      username: 'VENDEDOR1',
      first_name: 'Ana',
      last_name: 'Pérez',
      email: 'ana@example.com',
      role: 'seller',
      phone: '8112345678',
      commission: '0.7',
      is_active: true,
    });
    expect(state.commission).toBe('70.00');
  });
});

describe('formatUserCommissionPercent', () => {
  it('shows 0.7 as 70%', () => {
    expect(formatUserCommissionPercent('0.7')).toBe('70%');
    expect(formatUserCommissionPercent('0.70')).toBe('70%');
  });

  it('shows legacy whole percents without dividing again', () => {
    expect(formatUserCommissionPercent('70')).toBe('70%');
    expect(formatUserCommissionPercent('12.50')).toBe('12.5%');
  });

  it('shows empty as em dash and zero as 0%', () => {
    expect(formatUserCommissionPercent('')).toBe('—');
    expect(formatUserCommissionPercent(null)).toBe('—');
    expect(formatUserCommissionPercent('0')).toBe('0%');
  });
});
