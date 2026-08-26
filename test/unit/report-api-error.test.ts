import { describe, expect, it } from 'vitest';
import {
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

  it('skips login 400s', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/auth/login',
        response: { status: 400 },
      }),
    ).toBe(false);
  });

  it('skips 401, 403 and 404', () => {
    expect(
      shouldReportApiResponseError({
        request: '/api/rescue/cards/',
        response: { status: 401 },
      }),
    ).toBe(false);
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
