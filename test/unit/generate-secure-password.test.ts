import { describe, expect, it } from 'vitest';
import { generateSecurePassword } from '~/utils/generate-secure-password';

const UPPERCASE = /[A-Z]/;
const LOWERCASE = /[a-z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[!@#$%&*\-_+=?]/;

describe('generateSecurePassword', () => {
  it('generates at least 16 characters by default', () => {
    const password = generateSecurePassword();
    expect(password.length).toBeGreaterThanOrEqual(16);
  });

  it('respects custom length with a minimum of 8', () => {
    expect(generateSecurePassword(20).length).toBe(20);
    expect(generateSecurePassword(4).length).toBe(8);
  });

  it('includes uppercase, lowercase, digit, and symbol', () => {
    const password = generateSecurePassword();
    expect(password).toMatch(UPPERCASE);
    expect(password).toMatch(LOWERCASE);
    expect(password).toMatch(DIGIT);
    expect(password).toMatch(SYMBOL);
  });
});
