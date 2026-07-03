import { describe, expect, it } from 'vitest';
import {
  buildGuestAuthorizationPath,
  buildGuestAuthorizationUrl,
  extractApproveTokenFromGenerateResponse,
} from '~/utils/rescue-approve-link';

describe('buildGuestAuthorizationPath', () => {
  it('builds rescue authorization path with encoded token', () => {
    expect(buildGuestAuthorizationPath(42, 'abc/xyz')).toBe(
      '/rescue/42/authorization/abc%2Fxyz',
    );
  });
});

describe('buildGuestAuthorizationUrl', () => {
  it('prefixes origin when provided', () => {
    expect(buildGuestAuthorizationUrl(1, 'token', 'https://app.example.com')).toBe(
      'https://app.example.com/rescue/1/authorization/token',
    );
  });

  it('returns path only when origin is omitted', () => {
    expect(buildGuestAuthorizationUrl(1, 'token')).toBe(
      '/rescue/1/authorization/token',
    );
  });
});

describe('extractApproveTokenFromGenerateResponse', () => {
  it('reads api_key from first item when response is an array', () => {
    expect(
      extractApproveTokenFromGenerateResponse([
        {
          user: 'HOLA',
          api_key: 'l1erDiuL_fNrTbpw6Z25IXSMfJGTXPLsWrg4-jImTHZ8IPkKyRJQQBOLIP2JUWh9',
          numero_telefonico: '81 1010 1010',
        },
        {
          user: 'X',
          api_key: 'j_f7l1eYOzHmzPOO0a7wHMBij6-EbrxBPGgoogblxPLgSChbhsJn5l8GwUXNuqkN',
          numero_telefonico: '11 1111 1111',
        },
      ]),
    ).toBe('l1erDiuL_fNrTbpw6Z25IXSMfJGTXPLsWrg4-jImTHZ8IPkKyRJQQBOLIP2JUWh9');
  });

  it('reads api_key from generate response object', () => {
    expect(
      extractApproveTokenFromGenerateResponse({
        api_key: 'GbYi3ZN8mib9x99G8EKnHtfZPZz2TCkbBZlLrI-Zw63B1h1v_f_0Yd8_1bI6yYFT',
        numero_telefonico: '11 1111 1111',
        user: 'X',
      }),
    ).toBe('GbYi3ZN8mib9x99G8EKnHtfZPZz2TCkbBZlLrI-Zw63B1h1v_f_0Yd8_1bI6yYFT');
  });

  it('reads api_key from nested data wrapper', () => {
    expect(
      extractApproveTokenFromGenerateResponse({
        data: { api_key: 'nested-token' },
      }),
    ).toBe('nested-token');
  });

  it('reads token field', () => {
    expect(extractApproveTokenFromGenerateResponse({ token: 'abc123' })).toBe(
      'abc123',
    );
  });

  it('reads approve_token field', () => {
    expect(
      extractApproveTokenFromGenerateResponse({ approve_token: 'xyz' }),
    ).toBe('xyz');
  });

  it('extracts token from url field', () => {
    expect(
      extractApproveTokenFromGenerateResponse({
        url: 'https://app.example.com/rescue/5/authorization/my-token',
      }),
    ).toBe('my-token');
  });

  it('returns raw string when not a url', () => {
    expect(extractApproveTokenFromGenerateResponse('plain-token')).toBe(
      'plain-token',
    );
  });

  it('returns null for empty array', () => {
    expect(extractApproveTokenFromGenerateResponse([])).toBeNull();
  });

  it('returns null for empty or invalid payloads', () => {
    expect(extractApproveTokenFromGenerateResponse(null)).toBeNull();
    expect(extractApproveTokenFromGenerateResponse({})).toBeNull();
  });
});
