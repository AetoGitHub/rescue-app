import { describe, expect, it } from 'vitest';
import {
  parseGuestAuthorizationTokenParam,
  parseGuestRescueIdParam,
} from '~/utils/guest-rescue-route';

describe('parseGuestRescueIdParam', () => {
  it('parses positive integer id', () => {
    expect(parseGuestRescueIdParam('1')).toBe(1);
    expect(parseGuestRescueIdParam('42')).toBe(42);
  });

  it('rejects invalid ids', () => {
    expect(parseGuestRescueIdParam('')).toBeNull();
    expect(parseGuestRescueIdParam('0')).toBeNull();
    expect(parseGuestRescueIdParam('abc')).toBeNull();
    expect(parseGuestRescueIdParam(undefined)).toBeNull();
  });
});

describe('parseGuestAuthorizationTokenParam', () => {
  it('returns trimmed token string', () => {
    expect(parseGuestAuthorizationTokenParam('  abc  ')).toBe('abc');
  });
});
