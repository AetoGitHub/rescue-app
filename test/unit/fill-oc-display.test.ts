import { describe, expect, it } from 'vitest';
import {
  formatFillOcDateTime,
  formatFillOcMoney,
  matchesFillOcSearch,
} from '~/utils/fill-oc-display';

const SAMPLE_ITEM = {
  folio: 'RES-2026-00012',
  responsable: 'TEST TEST',
  vehicle: 'Unidad 12',
  service_description: 'Cambio de llanta',
  sub_total: 2974.14,
  iva: 475.86,
  total: '3450.00',
};

describe('formatFillOcMoney', () => {
  it('formats amounts as Mexican pesos with two decimals', () => {
    const expected = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(3450);

    expect(formatFillOcMoney('3450.00')).toBe(expected);
    expect(formatFillOcMoney('1200.50')).toBe(
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(1200.5),
    );
  });
});

describe('formatFillOcDateTime', () => {
  /** 14:32 UTC → 08:32 in America/Mexico_City (UTC-6, sin DST). */
  const utcInstant = '2026-08-10T14:32:07.123456Z';

  it('renders the UTC instant in America/Mexico_City', () => {
    const formatted = formatFillOcDateTime(utcInstant);

    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/8:32/);
    expect(formatted).not.toMatch(/14:32/);
  });

  it('returns an em dash when the date is missing or invalid', () => {
    expect(formatFillOcDateTime(null)).toBe('—');
    expect(formatFillOcDateTime('')).toBe('—');
    expect(formatFillOcDateTime('not-a-date')).toBe('—');
  });
});

describe('matchesFillOcSearch', () => {
  it('matches folio, responsable, unidad, description and amounts', () => {
    expect(matchesFillOcSearch(SAMPLE_ITEM, '')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, '  res-2026-00012  ')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, 'test')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, 'unidad 12')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, 'llanta')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, '3450')).toBe(true);
    expect(matchesFillOcSearch(SAMPLE_ITEM, 'xyz')).toBe(false);
  });
});
