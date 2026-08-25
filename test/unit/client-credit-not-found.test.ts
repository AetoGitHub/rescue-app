import { describe, expect, it } from 'vitest';
import {
  getCompanyCreditLoadErrorMessage,
  isClientCreditNotFoundError,
  isCompanyCreditServerError,
} from '../../app/utils/client-credit-not-found';

describe('isClientCreditNotFoundError', () => {
  it('detects 404 status code', () => {
    expect(isClientCreditNotFoundError({ statusCode: 404 })).toBe(true);
  });

  it('detects 400 status code as missing credit line', () => {
    expect(isClientCreditNotFoundError({ statusCode: 400 })).toBe(true);
  });

  it('detects status message No encontrado', () => {
    expect(
      isClientCreditNotFoundError({
        data: { status: 'No encontrado.' },
      }),
    ).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isClientCreditNotFoundError({ statusCode: 500 })).toBe(false);
    expect(isClientCreditNotFoundError(new Error('network'))).toBe(false);
  });
});

describe('company credit load errors', () => {
  it('flags only HTTP 500 as a backend server error', () => {
    expect(isCompanyCreditServerError({ statusCode: 500 })).toBe(true);
    expect(isCompanyCreditServerError({ statusCode: 502 })).toBe(false);
    expect(isCompanyCreditServerError({ statusCode: 400 })).toBe(false);
  });

  it('explains that a 500 is the server, not the proxy', () => {
    expect(getCompanyCreditLoadErrorMessage({ statusCode: 500 })).toBe(
      'Error del servidor al cargar el crédito. El problema está en el servidor, no en el proxy.',
    );
  });
});
