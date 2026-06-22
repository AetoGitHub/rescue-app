import { describe, expect, it } from 'vitest';
import { parseRescueQueryParam } from '../../app/utils/rescue-detail-query';

describe('rescue-detail-query', () => {
  it('parseRescueQueryParam accepts positive integers', () => {
    expect(parseRescueQueryParam('42')).toBe(42);
    expect(parseRescueQueryParam(42)).toBe(42);
    expect(parseRescueQueryParam(' 7 ')).toBe(7);
  });

  it('parseRescueQueryParam rejects invalid values', () => {
    expect(parseRescueQueryParam(undefined)).toBeNull();
    expect(parseRescueQueryParam(null)).toBeNull();
    expect(parseRescueQueryParam('')).toBeNull();
    expect(parseRescueQueryParam('abc')).toBeNull();
    expect(parseRescueQueryParam('0')).toBeNull();
    expect(parseRescueQueryParam('-1')).toBeNull();
    expect(parseRescueQueryParam('1.5')).toBeNull();
  });
});
