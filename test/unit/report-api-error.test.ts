import { describe, expect, it } from 'vitest';
import {
  normalizeApiPath,
  requestIdFromResponseHeaders,
  sanitizeApiErrorData,
  shouldReportApiResponseError,
} from '../../app/utils/report-api-error';

describe('shouldReportApiResponseError', () => {
  it('reports validation 400s', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/rescue/quote/',
        response: { status: 400, _data: { detail: 'Campo inválido' } },
        options: { method: 'POST' },
      }),
    ).toBe(true);
  });

  it('skips login 400s and 401s', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/auth/login',
        response: { status: 400 },
      }),
    ).toBe(false);
    expect(
      shouldReportApiResponseError({
        request: '/api/auth/login',
        response: { status: 401 },
      }),
    ).toBe(false);
  });

  it('reports 401 and 403 from API routes', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/credit/check/',
        response: { status: 401 },
        options: { method: 'POST' },
      }),
    ).toBe(true);
    expect(
      shouldReportApiResponseError({
        request: '/api/rescue/quote/create/',
        response: { status: 403 },
        options: { method: 'POST' },
      }),
    ).toBe(true);
  });

  it('skips 404', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/rescue/cards/',
        response: { status: 404 },
      }),
    ).toBe(false);
  });

  it('skips quote-not-found 400s', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/rescue/quote/',
        response: {
          status: 400,
          _data: { status: 'No encontrado' },
        },
      }),
    ).toBe(false);
  });
});

describe('report-api-error helpers', () => {
  it('strips query and numeric ids from api_path', () => {
    expect(
      normalizeApiPath('/api/rescue/cards/?status=pending_authorization&manager=50'),
    ).toBe('/api/rescue/cards/');
    expect(normalizeApiPath('/api/rescue/quote/detail/480/')).toBe(
      '/api/rescue/quote/detail/:id/',
    );
  });

  it('redacts sensitive keys in error payloads', () => {
    expect(
      sanitizeApiErrorData({
        detail: 'fail',
        password: 'secret',
        token: 'abc',
      }),
    ).toEqual({
      detail: 'fail',
      password: '[redacted]',
      token: '[redacted]',
    });
  });

  it('reads x-request-id from response headers', () => {
    expect(
      requestIdFromResponseHeaders({ 'x-request-id': 'req-12345678' }),
    ).toBe('req-12345678');
  });
});
