import { describe, expect, it } from 'vitest';
import { SESSION_EXPIRED_MESSAGE } from '../../shared/constants/session';
import {
  getApiDetailMessage,
  getFetchErrorMessage,
  getPasswordResetErrorMessage,
} from '../../app/utils/fetch-error-message';

describe('getApiDetailMessage', () => {
  it('reads string detail from error.data', () => {
    const msg = getApiDetailMessage({
      data: { detail: 'Código inválido o expirado.' },
    });
    expect(msg).toBe('Código inválido o expirado.');
  });

  it('joins array detail', () => {
    const msg = getApiDetailMessage({
      data: { detail: ['La contraseña es muy débil.', 'El código no existe.'] },
    });
    expect(msg).toBe('La contraseña es muy débil. El código no existe.');
  });
});

describe('getPasswordResetErrorMessage', () => {
  it('prefers detail over generic message', () => {
    const msg = getPasswordResetErrorMessage({
      statusCode: 400,
      message: '[POST] "/api/auth/password-reset/confirm": 400 Bad Request',
      data: { detail: 'Las contraseñas no coinciden.' },
    });
    expect(msg).toBe('Las contraseñas no coinciden.');
  });
});

describe('getFetchErrorMessage', () => {
  it('prefers DRF detail over ofetch status lines', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 400,
        message: '[POST] "/api/rescue/quote/create/": 400 Bad Request',
        statusMessage: 'Bad Request',
        data: { detail: 'Campo inválido' },
      }),
    ).toBe('Campo inválido');
  });

  it('maps 401 ofetch errors to a session message', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 401,
        message: '[POST] "/api/credit/check/": 401 Unauthorized',
        statusMessage: 'Unauthorized',
      }),
    ).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('maps session_expired payloads to the stable copy', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 401,
        message: 'Unauthorized',
        data: { code: 'session_expired', message: SESSION_EXPIRED_MESSAGE },
      }),
    ).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('maps generic DRF auth details on 401 to the session message', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 401,
        data: { detail: 'Authentication credentials were not provided.' },
      }),
    ).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('tags a 403 body from Django with 01', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 403,
        data: { detail: 'No tienes permiso para esta acción.' },
      }),
    ).toBe('01: No tienes permiso para esta acción.');
  });

  it('tags a generic 403 detail from Django with 01 instead of the session message', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 403,
        data: { detail: 'You do not have permission to perform this action.' },
      }),
    ).toBe('01: You do not have permission to perform this action.');
  });

  it('falls back to a tagged permission message on a bodyless 403', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 403,
        message: '[PUT] "/api/rescue/authorizer/1/": 403 Forbidden',
        statusMessage: 'Forbidden',
      }),
    ).toBe('01: No tienes permiso para completar esta acción.');
  });

  it('tags our own ability rejection with 02', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 403,
        data: { code: 'own_permission', message: 'No tienes permiso para esta acción.' },
      }),
    ).toBe('02: No tienes permiso para esta acción.');
  });

  it('maps generic HTTP reason phrases to the fallback', () => {
    expect(
      getFetchErrorMessage({
        statusCode: 502,
        message: '[POST] "/api/credit/check/": 502 Bad Gateway',
        statusMessage: 'Bad Gateway',
      }),
    ).toBe('No se pudo completar la operación.');
  });
});
