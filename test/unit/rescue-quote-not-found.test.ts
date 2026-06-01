import { describe, expect, it } from 'vitest';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

describe('isRescueQuoteNotFoundError', () => {
  it('returns true for 400 with status No encontrado', () => {
    const error = {
      statusCode: 400,
      data: { status: 'No encontrado.' },
    };
    expect(isRescueQuoteNotFoundError(error)).toBe(true);
  });

  it('returns true when status message is case-insensitive', () => {
    const error = {
      data: { status: 'no ENCONTRADO' },
    };
    expect(isRescueQuoteNotFoundError(error)).toBe(true);
  });

  it('returns false for other API errors', () => {
    const error = {
      statusCode: 400,
      data: { detail: 'Datos inválidos' },
    };
    expect(isRescueQuoteNotFoundError(error)).toBe(false);
  });

  it('returns false for non-object errors', () => {
    expect(isRescueQuoteNotFoundError(null)).toBe(false);
    expect(isRescueQuoteNotFoundError('error')).toBe(false);
  });
});
