import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SESSION_EXPIRED_CODE } from '../../shared/constants/session';
import { assertSessionToken, djangoProxyHeaders } from '../../server/utils/django-proxy';
import { sanitizeIncomingRequestId } from '../../server/utils/request-id';

vi.mock('../../server/utils/report-session-auth', () => ({
  reportSessionAuthFailure: vi.fn(),
}));

beforeAll(() => {
  vi.stubGlobal(
    'createError',
    (input: { statusCode: number; message: string; data?: unknown; statusMessage?: string }) =>
      Object.assign(new Error(input.message), input),
  );
});

describe('djangoProxyHeaders', () => {
  it('sends Token, language and request id', () => {
    expect(djangoProxyHeaders('abc', 'req-12345678')).toEqual({
      Authorization: 'Token abc',
      'Accept-Language': 'es',
      'x-request-id': 'req-12345678',
    });
  });
});

describe('assertSessionToken', () => {
  it('returns a trimmed token', () => {
    expect(
      assertSessionToken('  secret  ', { path: '/api/x/', requestId: 'req-1' }),
    ).toBe('secret');
  });

  it('throws session_expired when the token is missing', () => {
    try {
      assertSessionToken('  ', { path: '/api/x/', requestId: 'req-1' });
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 401,
        data: { code: SESSION_EXPIRED_CODE },
      });
    }
  });
});

describe('sanitizeIncomingRequestId', () => {
  it('accepts a uuid-like value', () => {
    expect(
      sanitizeIncomingRequestId('11111111-2222-4333-a444-555555555555'),
    ).toBe('11111111-2222-4333-a444-555555555555');
  });

  it('rejects empty or unsafe values', () => {
    expect(sanitizeIncomingRequestId('')).toBeNull();
    expect(sanitizeIncomingRequestId('a/b')).toBeNull();
    expect(sanitizeIncomingRequestId('short')).toBeNull();
  });
});
