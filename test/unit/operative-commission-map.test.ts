import { describe, expect, it } from 'vitest';
import {
  formatOperativeCommissionForApi,
  hasOperativeCommissionOverride,
  mapOperativeCommissionRow,
  operativeCommissionBadgeLabel,
  operativeCommissionDisplayName,
} from '~/utils/operative-commission-map';

describe('mapOperativeCommissionRow', () => {
  it('maps operator commission fields', () => {
    expect(
      mapOperativeCommissionRow({
        id: 2,
        username: 'GESTOR_ESTRELLA',
        first_name: 'Estrella',
        last_name: 'Cruz',
        commission: '20.00',
      }),
    ).toEqual({
      id: 2,
      username: 'GESTOR_ESTRELLA',
      first_name: 'Estrella',
      last_name: 'Cruz',
      commission: '20.00',
    });
  });

  it('normalizes empty commission to null', () => {
    expect(
      mapOperativeCommissionRow({
        id: 1,
        username: 'GESTOR',
        commission: '',
      }).commission,
    ).toBeNull();
  });
});

describe('operativeCommissionDisplayName', () => {
  it('prefers full name over username', () => {
    expect(
      operativeCommissionDisplayName({
        id: 1,
        username: 'gestor1',
        first_name: 'Ana',
        last_name: 'Ramirez',
        commission: null,
      }),
    ).toBe('Ana Ramirez');
  });
});

describe('hasOperativeCommissionOverride', () => {
  it('detects personalized commission', () => {
    expect(hasOperativeCommissionOverride('20.00')).toBe(true);
    expect(hasOperativeCommissionOverride(null)).toBe(false);
    expect(hasOperativeCommissionOverride('')).toBe(false);
  });
});

describe('formatOperativeCommissionForApi', () => {
  it('formats percent string for API', () => {
    expect(formatOperativeCommissionForApi('20')).toBe('20.00');
    expect(formatOperativeCommissionForApi('')).toBe('');
  });
});

describe('operativeCommissionBadgeLabel', () => {
  it('returns default or personalized label', () => {
    expect(operativeCommissionBadgeLabel(null)).toBe('Usa default global');
    expect(operativeCommissionBadgeLabel('20.00')).toBe('Personalizado: 20%');
  });
});
