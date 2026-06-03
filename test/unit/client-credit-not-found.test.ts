import { describe, expect, it } from 'vitest';
import { isClientCreditNotFoundError } from '../../app/utils/client-credit-not-found';

describe('isClientCreditNotFoundError', () => {
  it('detects 404 status code', () => {
    expect(isClientCreditNotFoundError({ statusCode: 404 })).toBe(true);
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
