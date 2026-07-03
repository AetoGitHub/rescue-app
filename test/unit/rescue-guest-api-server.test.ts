import { describe, expect, it } from 'vitest';
import {
  parseRescueGuestIdParam,
  parseRescueGuestTokenParam,
} from '../../server/utils/rescue-guest-api';

describe('parseRescueGuestIdParam', () => {
  it('parses positive integer', () => {
    expect(parseRescueGuestIdParam('42')).toBe(42);
  });

  it('rejects invalid ids', () => {
    expect(parseRescueGuestIdParam('0')).toBeNull();
    expect(parseRescueGuestIdParam('abc')).toBeNull();
    expect(parseRescueGuestIdParam(undefined)).toBeNull();
  });
});

describe('parseRescueGuestTokenParam', () => {
  it('returns trimmed token', () => {
    expect(parseRescueGuestTokenParam('  abc  ')).toBe('abc');
  });

  it('rejects empty token', () => {
    expect(parseRescueGuestTokenParam('')).toBeNull();
    expect(parseRescueGuestTokenParam(undefined)).toBeNull();
  });
});
